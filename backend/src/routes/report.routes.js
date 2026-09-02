const express = require('express');
const prisma = require('../prisma');
const { requireAuth, requireRole } = require('../middlewares/auth');

const router = express.Router();

// ─── Team Member Endpoints ─────────────────────────────────

/**
 * @route   GET /api/reports/mine
 * @desc    Get paginated list of current user's weekly reports with filters
 * @access  Private (Authenticated users - returns only requester's reports)
 */
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const { status, projectId, startDate, endDate, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * take;

    const where = {
      userId: req.user.id, // Strictly scoped to current user
    };

    if (status) {
      where.status = status;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (startDate) {
      where.weekStartDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.weekEndDate = { ...(where.weekEndDate || {}), lte: new Date(endDate) };
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { weekStartDate: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          versions: {
            orderBy: { versionNum: 'desc' },
            take: 1,
            include: {
              tasks: true,
            },
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              reviewer: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      reports,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/reports
 * @desc    Create a new report in DRAFT status with initial version and tasks
 * @access  Private (Team members and authenticated users)
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { projectId, weekStartDate, weekEndDate, content, tasks } = req.body;

    if (!projectId || !weekStartDate || !weekEndDate) {
      return res.status(400).json({ error: 'projectId, weekStartDate, and weekEndDate are required' });
    }

    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check unique constraint for (userId, projectId, weekStartDate)
    const existing = await prisma.report.findUnique({
      where: {
        userId_projectId_weekStartDate: {
          userId: req.user.id,
          projectId,
          weekStartDate: start,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'A report for this project and week already exists. Please edit the existing report.',
        reportId: existing.id,
      });
    }

    const reportContent = content || {
      blockers: '',
      achievements: '',
      notes: 'Initial draft',
      hoursBreakdown: { development: 0, meetings: 0, codeReview: 0, documentation: 0, learning: 0 },
    };

    const taskList = Array.isArray(tasks) ? tasks : [];

    // Create Report, ReportVersion 1, and TaskEntry items in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          userId: req.user.id,
          projectId,
          weekStartDate: start,
          weekEndDate: end,
          status: 'DRAFT',
          version: 1,
        },
      });

      const version = await tx.reportVersion.create({
        data: {
          reportId: report.id,
          versionNum: 1,
          content: reportContent,
          submittedAt: new Date(),
        },
      });

      if (taskList.length > 0) {
        await tx.taskEntry.createMany({
          data: taskList.map((t) => ({
            reportVersionId: version.id,
            taskName: t.taskName || 'Untitled Task',
            priority: t.priority || 'MEDIUM',
            plannedPercent: Number(t.plannedPercent) || 0,
            actualPercent: Number(t.actualPercent) || 0,
            status: t.status || 'NOT_STARTED',
            timePlanned: Number(t.timePlanned) || 0,
            timeSpent: Number(t.timeSpent) || 0,
            deliverable: t.deliverable || null,
          })),
        });
      }

      return tx.report.findUnique({
        where: { id: report.id },
        include: {
          project: true,
          versions: {
            include: { tasks: true },
          },
        },
      });
    });

    res.status(201).json({
      message: 'Draft report created successfully',
      report: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/reports/:id
 * @desc    Edit report (Allowed ONLY by report owner, and ONLY when status is DRAFT or NEEDS_CORRECTION)
 * @access  Private (Owner only)
 */
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        versions: {
          orderBy: { versionNum: 'desc' },
          take: 1,
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // ─── Critical Security Guard ──────────────────────────────
    // 1. Enforce that only the report owner can modify content
    if (report.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden: You cannot edit another team member\'s report. Managers can only submit reviews.',
      });
    }

    // 2. Enforce status lock: Can only edit DRAFT or NEEDS_CORRECTION
    if (!['DRAFT', 'NEEDS_CORRECTION'].includes(report.status)) {
      return res.status(400).json({
        error: `Cannot edit a report with status '${report.status}'. Only DRAFT or NEEDS_CORRECTION reports can be edited.`,
      });
    }

    const { projectId, content, tasks } = req.body;

    const latestVersion = report.versions[0];

    const updated = await prisma.$transaction(async (tx) => {
      // Update top-level report if project changed
      if (projectId && projectId !== report.projectId) {
        await tx.report.update({
          where: { id: report.id },
          data: { projectId },
        });
      }

      // Update current version content
      if (content && latestVersion) {
        await tx.reportVersion.update({
          where: { id: latestVersion.id },
          data: { content },
        });
      }

      // Replace tasks for the current version if tasks array was supplied
      if (Array.isArray(tasks) && latestVersion) {
        await tx.taskEntry.deleteMany({
          where: { reportVersionId: latestVersion.id },
        });

        if (tasks.length > 0) {
          await tx.taskEntry.createMany({
            data: tasks.map((t) => ({
              reportVersionId: latestVersion.id,
              taskName: t.taskName || 'Untitled Task',
              priority: t.priority || 'MEDIUM',
              plannedPercent: Number(t.plannedPercent) || 0,
              actualPercent: Number(t.actualPercent) || 0,
              status: t.status || 'NOT_STARTED',
              timePlanned: Number(t.timePlanned) || 0,
              timeSpent: Number(t.timeSpent) || 0,
              deliverable: t.deliverable || null,
            })),
          });
        }
      }

      return tx.report.findUnique({
        where: { id: report.id },
        include: {
          project: true,
          versions: {
            orderBy: { versionNum: 'desc' },
            take: 1,
            include: { tasks: true },
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    res.json({
      message: 'Report updated successfully',
      report: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/reports/:id/submit
 * @desc    Submit report (moves DRAFT/NEEDS_CORRECTION -> SUBMITTED; creates new ReportVersion if resubmitting)
 * @access  Private (Owner only)
 */
router.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        versions: {
          orderBy: { versionNum: 'desc' },
          take: 1,
          include: { tasks: true },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // ─── Critical Security Guard ──────────────────────────────
    if (report.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only submit your own reports' });
    }

    if (!['DRAFT', 'NEEDS_CORRECTION'].includes(report.status)) {
      return res.status(400).json({
        error: `Report is already ${report.status}. Only DRAFT or NEEDS_CORRECTION reports can be submitted.`,
      });
    }

    const { content, tasks } = req.body;
    const latestVersion = report.versions[0];

    const updated = await prisma.$transaction(async (tx) => {
      if (report.status === 'NEEDS_CORRECTION') {
        // ── Resubmission Cycle: create a new immutable version snapshot ──
        const nextVersionNum = report.version + 1;

        const newContent = content || latestVersion?.content || {
          notes: `Resubmission (v${nextVersionNum}) following manager feedback.`,
        };

        const newVersion = await tx.reportVersion.create({
          data: {
            reportId: report.id,
            versionNum: nextVersionNum,
            content: newContent,
            submittedAt: new Date(),
          },
        });

        // Determine tasks to link to new version
        const tasksToSave = Array.isArray(tasks) && tasks.length > 0
          ? tasks
          : (latestVersion?.tasks || []);

        if (tasksToSave.length > 0) {
          await tx.taskEntry.createMany({
            data: tasksToSave.map((t) => ({
              reportVersionId: newVersion.id,
              taskName: t.taskName || 'Untitled Task',
              priority: t.priority || 'MEDIUM',
              plannedPercent: Number(t.plannedPercent) || 0,
              actualPercent: Number(t.actualPercent) || 0,
              status: t.status || 'NOT_STARTED',
              timePlanned: Number(t.timePlanned) || 0,
              timeSpent: Number(t.timeSpent) || 0,
              deliverable: t.deliverable || null,
            })),
          });
        }

        await tx.report.update({
          where: { id: report.id },
          data: {
            status: 'SUBMITTED',
            version: nextVersionNum,
          },
        });
      } else {
        // ── First submission from DRAFT ──
        if (content && latestVersion) {
          await tx.reportVersion.update({
            where: { id: latestVersion.id },
            data: { content, submittedAt: new Date() },
          });
        }

        if (Array.isArray(tasks) && latestVersion) {
          await tx.taskEntry.deleteMany({
            where: { reportVersionId: latestVersion.id },
          });
          if (tasks.length > 0) {
            await tx.taskEntry.createMany({
              data: tasks.map((t) => ({
                reportVersionId: latestVersion.id,
                taskName: t.taskName || 'Untitled Task',
                priority: t.priority || 'MEDIUM',
                plannedPercent: Number(t.plannedPercent) || 0,
                actualPercent: Number(t.actualPercent) || 0,
                status: t.status || 'NOT_STARTED',
                timePlanned: Number(t.timePlanned) || 0,
                timeSpent: Number(t.timeSpent) || 0,
                deliverable: t.deliverable || null,
              })),
            });
          }
        }

        await tx.report.update({
          where: { id: report.id },
          data: { status: 'SUBMITTED' },
        });
      }

      return tx.report.findUnique({
        where: { id: report.id },
        include: {
          project: true,
          versions: {
            orderBy: { versionNum: 'desc' },
            include: { tasks: true },
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    res.json({
      message: 'Report submitted successfully for manager review',
      report: updated,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/reports/:id/versions
 * @desc    View all past versions of a report with their task entries and reviews
 * @access  Private (Report owner or Manager)
 */
router.get('/:id/versions', requireAuth, async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // ─── Critical Security Guard ──────────────────────────────
    if (req.user.role !== 'MANAGER' && report.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden: You cannot view version history of another team member\'s report',
      });
    }

    const versions = await prisma.reportVersion.findMany({
      where: { reportId: req.params.id },
      orderBy: { versionNum: 'desc' },
      include: {
        tasks: true,
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.json({ versions });
  } catch (error) {
    next(error);
  }
});

// ─── Manager Endpoints ─────────────────────────────────────

/**
 * @route   GET /api/reports
 * @desc    Get all team reports (paginated, filterable by member, project, status, date)
 * @access  Private (Manager only)
 */
router.get('/', requireAuth, requireRole('MANAGER'), async (req, res, next) => {
  try {
    const { userId, projectId, status, startDate, endDate, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * take;

    const where = {};

    if (userId) {
      where.userId = userId;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }
    if (startDate) {
      where.weekStartDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.weekEndDate = { ...(where.weekEndDate || {}), lte: new Date(endDate) };
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { weekStartDate: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          project: { select: { id: true, name: true } },
          versions: {
            orderBy: { versionNum: 'desc' },
            take: 1,
            include: { tasks: true },
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              reviewer: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      reports,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get full report detail with all versions, task entries, and review history
 * @access  Private (Report owner or Manager)
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        project: true,
        versions: {
          orderBy: { versionNum: 'desc' },
          include: {
            tasks: true,
            reviews: {
              include: {
                reviewer: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // ─── Critical Security Guard ──────────────────────────────
    // Team member can ONLY view their own report; Manager can view any
    if (req.user.role !== 'MANAGER' && report.userId !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to view another team member\'s report',
      });
    }

    res.json({ report });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/reports/:id/review
 * @desc    Submit a manager review (APPROVED or REQUEST_CHANGES) with comment
 * @access  Private (Manager only)
 */
router.post('/:id/review', requireAuth, requireRole('MANAGER'), async (req, res, next) => {
  try {
    const { action, comment } = req.body;

    if (!action || !['APPROVED', 'REQUEST_CHANGES'].includes(action)) {
      return res.status(400).json({
        error: "Action must be either 'APPROVED' or 'REQUEST_CHANGES'",
      });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'A review comment is required' });
    }

    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        versions: {
          orderBy: { versionNum: 'desc' },
          take: 1,
        },
      },
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const latestVersion = report.versions[0];
    if (!latestVersion) {
      return res.status(400).json({ error: 'Report has no submitted versions to review' });
    }

    const nextStatus = action === 'APPROVED' ? 'APPROVED' : 'NEEDS_CORRECTION';

    const [review, updatedReport] = await prisma.$transaction([
      prisma.reportReview.create({
        data: {
          reportId: report.id,
          reviewerId: req.user.id,
          action,
          comment: comment.trim(),
          reportVersionId: latestVersion.id,
        },
        include: {
          reviewer: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.report.update({
        where: { id: report.id },
        data: { status: nextStatus },
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: true,
          versions: {
            orderBy: { versionNum: 'desc' },
            take: 1,
            include: { tasks: true },
          },
        },
      }),
    ]);

    res.json({
      message: `Report ${action === 'APPROVED' ? 'approved' : 'marked for correction'} successfully`,
      review,
      report: updatedReport,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
