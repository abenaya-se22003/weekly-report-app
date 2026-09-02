const express = require('express');
const prisma = require('../prisma');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

/**
 * Helper to get date of Monday of the current or most recent week
 */
function getStartOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get manager KPI summary metrics (submissions, compliance, needs-correction, blockers)
 * @access  Private (Manager only)
 */
router.get('/summary', requireAuth, requireRole('MANAGER'), async (req, res, next) => {
  try {
    // 1. Total team members
    const teamMembersCount = await prisma.user.count({
      where: { role: 'TEAM_MEMBER' },
    });

    // 2. Total active projects
    const projectsCount = await prisma.project.count({
      where: { isActive: true },
    });

    // 3. Needs correction count
    const needsCorrectionCount = await prisma.report.count({
      where: { status: 'NEEDS_CORRECTION' },
    });

    // 4. Drafts, Submitted, Approved overall
    const [draftCount, submittedCount, approvedCount] = await Promise.all([
      prisma.report.count({ where: { status: 'DRAFT' } }),
      prisma.report.count({ where: { status: 'SUBMITTED' } }),
      prisma.report.count({ where: { status: 'APPROVED' } }),
    ]);

    // 5. Most recent week metrics
    const latestReport = await prisma.report.findFirst({
      orderBy: { weekStartDate: 'desc' },
      select: { weekStartDate: true },
    });

    let currentWeekSubmissions = 0;
    let complianceRate = 0;

    if (latestReport) {
      const latestWeekDate = latestReport.weekStartDate;
      const thisWeekReports = await prisma.report.findMany({
        where: {
          weekStartDate: latestWeekDate,
        },
        select: { status: true, userId: true },
      });

      // Count submitted/approved/needs_correction
      const submittedThisWeek = thisWeekReports.filter((r) =>
        ['SUBMITTED', 'APPROVED', 'NEEDS_CORRECTION'].includes(r.status)
      );
      currentWeekSubmissions = submittedThisWeek.length;

      const uniqueSubmitters = new Set(submittedThisWeek.map((r) => r.userId)).size;
      complianceRate = teamMembersCount > 0
        ? Math.round((uniqueSubmitters / teamMembersCount) * 100)
        : 0;
    }

    // 6. Open blockers count (from TaskEntry status BLOCKED and report content blockers)
    const blockedTasksCount = await prisma.taskEntry.count({
      where: { status: 'BLOCKED' },
    });

    const versionsWithBlockers = await prisma.reportVersion.findMany({
      select: { content: true },
    });

    let reportsWithBlockersCount = 0;
    for (const v of versionsWithBlockers) {
      if (
        v.content &&
        typeof v.content.blockers === 'string' &&
        v.content.blockers.trim().length > 0 &&
        !v.content.blockers.toLowerCase().includes('no blocker')
      ) {
        reportsWithBlockersCount++;
      }
    }

    res.json({
      summary: {
        totalTeamMembers: teamMembersCount,
        totalActiveProjects: projectsCount,
        submittedThisWeek: currentWeekSubmissions,
        complianceRate,
        needsCorrectionCount,
        draftCount,
        submittedCount,
        approvedCount,
        openBlockersCount: blockedTasksCount + reportsWithBlockersCount,
        blockedTasksCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/dashboard/charts
 * @desc    Get chart datasets for tasks trend, status by member, workload by project, time by task type
 * @access  Private (Manager only)
 */
router.get('/charts', requireAuth, requireRole('MANAGER'), async (req, res, next) => {
  try {
    // ── 1. Status breakdown by Team Member ──
    const teamMembers = await prisma.user.findMany({
      where: { role: 'TEAM_MEMBER' },
      select: {
        id: true,
        name: true,
        email: true,
        reports: {
          select: { status: true },
        },
      },
    });

    const statusByTeamMember = teamMembers.map((member) => {
      const counts = {
        DRAFT: 0,
        SUBMITTED: 0,
        NEEDS_CORRECTION: 0,
        APPROVED: 0,
      };

      for (const r of member.reports) {
        if (counts[r.status] !== undefined) {
          counts[r.status]++;
        }
      }

      return {
        userId: member.id,
        name: member.name,
        email: member.email,
        ...counts,
        total: member.reports.length,
      };
    });

    // ── 2. Workload & Hours by Project ──
    const projects = await prisma.project.findMany({
      include: {
        reports: {
          include: {
            versions: {
              orderBy: { versionNum: 'desc' },
              take: 1,
              include: { tasks: true },
            },
          },
        },
      },
    });

    const workloadByProject = projects.map((p) => {
      let totalHoursPlanned = 0;
      let totalHoursSpent = 0;
      let totalTasks = 0;
      let completedTasks = 0;

      for (const rep of p.reports) {
        const latestVer = rep.versions[0];
        if (latestVer) {
          for (const task of latestVer.tasks) {
            totalTasks++;
            totalHoursPlanned += task.timePlanned || 0;
            totalHoursSpent += task.timeSpent || 0;
            if (task.status === 'COMPLETED') completedTasks++;
          }
        }
      }

      return {
        projectId: p.id,
        projectName: p.name,
        isActive: p.isActive,
        reportsCount: p.reports.length,
        totalTasks,
        completedTasks,
        totalHoursPlanned: Math.round(totalHoursPlanned * 10) / 10,
        totalHoursSpent: Math.round(totalHoursSpent * 10) / 10,
      };
    });

    // ── 3. Tasks Completed Trend by Week ──
    const reportsWithTasks = await prisma.report.findMany({
      orderBy: { weekStartDate: 'asc' },
      include: {
        versions: {
          orderBy: { versionNum: 'desc' },
          take: 1,
          include: { tasks: true },
        },
      },
    });

    const weekMap = new Map();

    for (const rep of reportsWithTasks) {
      const weekKey = rep.weekStartDate.toISOString().split('T')[0];
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          week: weekKey,
          completed: 0,
          inProgress: 0,
          blocked: 0,
          notStarted: 0,
          total: 0,
        });
      }

      const weekData = weekMap.get(weekKey);
      const latestVer = rep.versions[0];

      if (latestVer) {
        for (const t of latestVer.tasks) {
          weekData.total++;
          if (t.status === 'COMPLETED') weekData.completed++;
          else if (t.status === 'IN_PROGRESS') weekData.inProgress++;
          else if (t.status === 'BLOCKED') weekData.blocked++;
          else weekData.notStarted++;
        }
      }
    }

    const tasksTrend = Array.from(weekMap.values());

    // ── 4. Time Breakdown by Task Type (Aggregated across latest versions) ──
    const latestVersions = await prisma.reportVersion.findMany({
      distinct: ['reportId'],
      orderBy: [{ reportId: 'asc' }, { versionNum: 'desc' }],
      select: { content: true },
    });

    const timeByTaskType = {
      development: 0,
      meetings: 0,
      codeReview: 0,
      documentation: 0,
      learning: 0,
    };

    for (const v of latestVersions) {
      if (v.content && v.content.hoursBreakdown) {
        const hb = v.content.hoursBreakdown;
        timeByTaskType.development += Number(hb.development) || 0;
        timeByTaskType.meetings += Number(hb.meetings) || 0;
        timeByTaskType.codeReview += Number(hb.codeReview) || 0;
        timeByTaskType.documentation += Number(hb.documentation) || 0;
        timeByTaskType.learning += Number(hb.learning) || 0;
      }
    }

    // Round values
    Object.keys(timeByTaskType).forEach((k) => {
      timeByTaskType[k] = Math.round(timeByTaskType[k] * 10) / 10;
    });

    res.json({
      charts: {
        statusByTeamMember,
        workloadByProject,
        tasksTrend,
        timeByTaskType,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
