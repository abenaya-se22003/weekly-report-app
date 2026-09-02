const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────

function monday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d;
}

function friday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setDate(d.getDate() + 4);
  return d;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function randomFloat(min, max) {
  return Math.round((min + Math.random() * (max - min)) * 10) / 10;
}

// ─── Seed Data Definitions ──────────────────────────────

const TEAM_MEMBERS = [
  { name: 'Alice Chen',       email: 'alice.chen@company.com' },
  { name: 'Bob Martinez',     email: 'bob.martinez@company.com' },
  { name: 'Charlie Kim',      email: 'charlie.kim@company.com' },
  { name: 'Diana Patel',      email: 'diana.patel@company.com' },
  { name: 'Ethan Novak',      email: 'ethan.novak@company.com' },
];

const MANAGERS = [
  { name: 'Sarah Johnson',    email: 'sarah.johnson@company.com' },
  { name: 'Michael Torres',   email: 'michael.torres@company.com' },
];

const PROJECTS = [
  { name: 'Client A',          description: 'Enterprise client portal with custom analytics dashboard and reporting module' },
  { name: 'Internal Tooling',  description: 'Developer productivity tools including CI/CD pipeline improvements and monitoring' },
  { name: 'R&D',               description: 'Research and development for next-gen ML-powered recommendation engine' },
  { name: 'Marketing',         description: 'Marketing website redesign, SEO optimization, and campaign landing pages' },
];

// 6 weeks of Mondays: July 21 → Aug 25, 2026
const WEEK_STARTS = [
  '2026-07-20', // Week 1
  '2026-07-27', // Week 2
  '2026-08-03', // Week 3
  '2026-08-10', // Week 4
  '2026-08-17', // Week 5
  '2026-08-24', // Week 6
];

// Task templates per project
const TASK_TEMPLATES = {
  'Client A': [
    { taskName: 'Implement authentication API',          deliverable: 'REST API endpoints for login/signup' },
    { taskName: 'Build analytics dashboard components',  deliverable: 'React components for charts and filters' },
    { taskName: 'Database schema optimization',          deliverable: 'Optimized queries, migration scripts' },
    { taskName: 'Write integration tests',               deliverable: 'Test suite with 90%+ coverage' },
    { taskName: 'Client feedback implementation',        deliverable: 'Updated UI based on client review' },
    { taskName: 'API documentation',                     deliverable: 'Swagger/OpenAPI specification' },
    { taskName: 'Performance profiling',                 deliverable: 'Performance report with bottleneck fixes' },
    { taskName: 'Security audit fixes',                  deliverable: 'Patched vulnerabilities report' },
  ],
  'Internal Tooling': [
    { taskName: 'CI/CD pipeline improvements',           deliverable: 'Updated GitHub Actions workflows' },
    { taskName: 'Monitoring dashboard setup',            deliverable: 'Grafana dashboards with alerts' },
    { taskName: 'Code review automation',                deliverable: 'Automated linting and review bot' },
    { taskName: 'Developer onboarding docs',             deliverable: 'Updated wiki and setup scripts' },
    { taskName: 'Dependency upgrade audit',              deliverable: 'Upgrade report and PRs' },
    { taskName: 'Internal CLI tool',                     deliverable: 'CLI binary and README' },
    { taskName: 'Log aggregation pipeline',              deliverable: 'ELK stack configuration' },
  ],
  'R&D': [
    { taskName: 'Literature review on transformer models', deliverable: 'Research summary document' },
    { taskName: 'Prototype recommendation engine',       deliverable: 'Jupyter notebook with results' },
    { taskName: 'Data pipeline for training data',       deliverable: 'ETL scripts and data quality report' },
    { taskName: 'Model evaluation framework',            deliverable: 'Evaluation harness with metrics' },
    { taskName: 'A/B testing infrastructure',            deliverable: 'Feature flag system and analytics' },
    { taskName: 'GPU cluster optimization',              deliverable: 'Cost analysis and scaling config' },
  ],
  'Marketing': [
    { taskName: 'Landing page redesign',                 deliverable: 'Figma mockups and HTML/CSS' },
    { taskName: 'SEO audit and optimization',            deliverable: 'SEO report with implemented fixes' },
    { taskName: 'Email campaign templates',              deliverable: 'Responsive email HTML templates' },
    { taskName: 'Social media integration',              deliverable: 'API integrations for auto-posting' },
    { taskName: 'Analytics tracking setup',              deliverable: 'GA4 events and conversion tracking' },
    { taskName: 'Blog CMS migration',                    deliverable: 'Migrated content and redirects' },
  ],
};

const REVIEW_COMMENTS_APPROVE = [
  'Great work this week! All deliverables look solid.',
  'Excellent progress. The quality of the code is very high.',
  'Approved. Nice job on the documentation as well.',
  'Everything looks good. Keep up the great work!',
  'Well done — the client will be happy with this progress.',
  'Thorough and well-structured. Approved.',
];

const REVIEW_COMMENTS_CHANGES = [
  'Please add more detail to the blockers section — what specifically is blocking you?',
  'The hours don\'t add up to your expected capacity. Please verify and resubmit.',
  'Missing deliverable links for the completed tasks. Please update.',
  'The planned vs actual percentages seem off. Can you double-check?',
  'Good progress, but please break down the "misc tasks" into specific items.',
  'Need more context on the deferred tasks — what\'s the new timeline?',
];

const BLOCKERS = [
  'Waiting for API keys from the client',
  'Blocked on design review from UX team',
  'Database migration requires downtime window approval',
  'Dependency on Team B\'s microservice deployment',
  'No blockers this week',
  'CI pipeline intermittently failing on Windows runners',
  'Waiting for security team sign-off',
  'Need access to production logs for debugging',
  '',
];

const ACHIEVEMENTS = [
  'Reduced API response time by 40% through query optimization',
  'Achieved 95% test coverage on the auth module',
  'Successfully deployed v2.1 to production with zero downtime',
  'Completed the client demo ahead of schedule',
  'Mentored new team member on codebase architecture',
  'Resolved a critical production bug within 2 hours',
  'Streamlined the deployment pipeline, saving 15 min per deploy',
  'Presented research findings to leadership team',
  '',
];

// ─── Main Seed Function ─────────────────────────────────

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data in correct order (respecting FK constraints)
  console.log('  🗑  Cleaning existing data...');
  await prisma.taskEntry.deleteMany();
  await prisma.reportReview.deleteMany();
  await prisma.reportVersion.deleteMany();
  await prisma.report.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ── 1. Create Users ─────────────────────────────────
  console.log('  👤 Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [];
  for (const member of TEAM_MEMBERS) {
    const user = await prisma.user.create({
      data: {
        name: member.name,
        email: member.email,
        passwordHash,
        role: 'TEAM_MEMBER',
      },
    });
    users.push(user);
  }

  const managers = [];
  for (const mgr of MANAGERS) {
    const manager = await prisma.user.create({
      data: {
        name: mgr.name,
        email: mgr.email,
        passwordHash,
        role: 'MANAGER',
      },
    });
    managers.push(manager);
  }
  console.log(`     ✓ Created ${users.length} team members and ${managers.length} managers`);

  // ── 2. Create Projects ──────────────────────────────
  console.log('  📁 Creating projects...');
  const projects = [];
  for (const proj of PROJECTS) {
    const project = await prisma.project.create({
      data: {
        name: proj.name,
        description: proj.description,
        isActive: true,
      },
    });
    projects.push(project);
  }
  console.log(`     ✓ Created ${projects.length} projects`);

  // ── 3. Create Reports, Versions, Tasks, Reviews ─────
  console.log('  📝 Creating reports with versions, tasks, and reviews...');

  let reportCount = 0;
  let versionCount = 0;
  let taskCount = 0;
  let reviewCount = 0;

  // Status distribution plan per week index for each user
  // Week 0-1: older weeks → mostly APPROVED
  // Week 2-3: middle weeks → mix of APPROVED, NEEDS_CORRECTION, SUBMITTED
  // Week 4:   recent → SUBMITTED
  // Week 5:   current → DRAFT
  const statusByWeek = [
    'APPROVED',           // Week 1 (oldest)
    'APPROVED',           // Week 2
    'NEEDS_CORRECTION',   // Week 3
    'APPROVED',           // Week 4
    'SUBMITTED',          // Week 5
    'DRAFT',              // Week 6 (most recent)
  ];

  for (const user of users) {
    // Each user works on 2 projects (rotate assignments)
    const userIndex = users.indexOf(user);
    const userProjects = [
      projects[userIndex % projects.length],
      projects[(userIndex + 1) % projects.length],
    ];

    for (let weekIdx = 0; weekIdx < WEEK_STARTS.length; weekIdx++) {
      // Each user submits 1 report per week (on their primary project)
      // Alternate between their 2 assigned projects
      const project = userProjects[weekIdx % 2];
      const weekStart = monday(WEEK_STARTS[weekIdx]);
      const weekEnd = friday(WEEK_STARTS[weekIdx]);

      // Determine status — vary it per user to avoid all users having identical patterns
      let status;
      if (userIndex % 2 === 0) {
        status = statusByWeek[weekIdx];
      } else {
        // Alternate pattern for odd-indexed users
        const altStatuses = ['APPROVED', 'NEEDS_CORRECTION', 'APPROVED', 'SUBMITTED', 'APPROVED', 'DRAFT'];
        status = altStatuses[weekIdx];
      }

      // Determine how many versions this report should have
      let numVersions = 1;
      if (status === 'NEEDS_CORRECTION') numVersions = 2;  // submitted once, sent back
      if (status === 'APPROVED' && weekIdx <= 1) numVersions = Math.random() > 0.5 ? 2 : 1; // some approved reports went through a revision cycle

      const report = await prisma.report.create({
        data: {
          userId: user.id,
          projectId: project.id,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          status,
          version: numVersions,
        },
      });
      reportCount++;

      const projectTasks = TASK_TEMPLATES[project.name];

      // Create versions
      for (let v = 1; v <= numVersions; v++) {
        const submittedAt = new Date(weekEnd);
        submittedAt.setDate(submittedAt.getDate() + v); // each version submitted a day later

        const version = await prisma.reportVersion.create({
          data: {
            reportId: report.id,
            versionNum: v,
            content: {
              blockers: pick(BLOCKERS),
              achievements: pick(ACHIEVEMENTS),
              notes: v > 1
                ? 'Updated report based on manager feedback. Revised task breakdowns and added missing deliverables.'
                : 'Standard weekly report submission.',
              hoursBreakdown: {
                development: randomFloat(15, 25),
                meetings: randomFloat(3, 8),
                codeReview: randomFloat(2, 6),
                documentation: randomFloat(1, 4),
                learning: randomFloat(0, 3),
              },
            },
            submittedAt,
          },
        });
        versionCount++;

        // Create 3-5 task entries per version
        const numTasks = 3 + Math.floor(Math.random() * 3);
        const selectedTasks = pickN(projectTasks, numTasks);

        for (const taskTemplate of selectedTasks) {
          const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
          const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'DEFERRED'];

          // Make task statuses realistic based on report status
          let taskStatus;
          if (status === 'DRAFT') {
            taskStatus = pick(['NOT_STARTED', 'IN_PROGRESS']);
          } else if (status === 'APPROVED') {
            taskStatus = pick(['COMPLETED', 'COMPLETED', 'COMPLETED', 'IN_PROGRESS']);
          } else {
            taskStatus = pick(statuses);
          }

          const planned = randomFloat(10, 40);
          const actual = taskStatus === 'COMPLETED' ? planned : randomFloat(0, planned);

          await prisma.taskEntry.create({
            data: {
              reportVersionId: version.id,
              taskName: taskTemplate.taskName,
              priority: pick(priorities),
              plannedPercent: planned,
              actualPercent: actual,
              status: taskStatus,
              timePlanned: randomFloat(2, 12),
              timeSpent: randomFloat(1, 12),
              deliverable: taskTemplate.deliverable,
            },
          });
          taskCount++;
        }

        // Create reviews for non-DRAFT, non-first-submitted reports
        if (status !== 'DRAFT' && status !== 'SUBMITTED') {
          // If NEEDS_CORRECTION — manager requested changes on version 1
          if (status === 'NEEDS_CORRECTION' && v === 1) {
            const reviewer = pick(managers);
            await prisma.reportReview.create({
              data: {
                reportId: report.id,
                reviewerId: reviewer.id,
                action: 'REQUEST_CHANGES',
                comment: pick(REVIEW_COMMENTS_CHANGES),
                reportVersionId: version.id,
              },
            });
            reviewCount++;
          }

          // If APPROVED — manager approved (on the latest version)
          if (status === 'APPROVED' && v === numVersions) {
            const reviewer = pick(managers);
            await prisma.reportReview.create({
              data: {
                reportId: report.id,
                reviewerId: reviewer.id,
                action: 'APPROVED',
                comment: pick(REVIEW_COMMENTS_APPROVE),
                reportVersionId: version.id,
              },
            });
            reviewCount++;

            // If this was a multi-version approved report, add a REQUEST_CHANGES on v1
            if (numVersions > 1 && v === numVersions) {
              // The first version already got a review above only if NEEDS_CORRECTION
              // For APPROVED multi-version, add a REQUEST_CHANGES review on version 1
              const firstVersion = await prisma.reportVersion.findUnique({
                where: {
                  reportId_versionNum: {
                    reportId: report.id,
                    versionNum: 1,
                  },
                },
              });
              if (firstVersion) {
                await prisma.reportReview.create({
                  data: {
                    reportId: report.id,
                    reviewerId: reviewer.id,
                    action: 'REQUEST_CHANGES',
                    comment: pick(REVIEW_COMMENTS_CHANGES),
                    reportVersionId: firstVersion.id,
                  },
                });
                reviewCount++;
              }
            }
          }
        }
      }
    }
  }

  console.log(`     ✓ Created ${reportCount} reports`);
  console.log(`     ✓ Created ${versionCount} report versions`);
  console.log(`     ✓ Created ${taskCount} task entries`);
  console.log(`     ✓ Created ${reviewCount} reviews`);

  console.log('\n✅ Database seeded successfully!\n');

  // Print summary
  console.log('  ┌─────────────────────────────────────┐');
  console.log('  │        Seed Summary                  │');
  console.log('  ├─────────────────────────────────────┤');
  console.log(`  │  Users:           ${(users.length + managers.length).toString().padStart(3)}              │`);
  console.log(`  │  Projects:        ${projects.length.toString().padStart(3)}              │`);
  console.log(`  │  Reports:         ${reportCount.toString().padStart(3)}              │`);
  console.log(`  │  Report Versions: ${versionCount.toString().padStart(3)}              │`);
  console.log(`  │  Task Entries:    ${taskCount.toString().padStart(3)}              │`);
  console.log(`  │  Reviews:         ${reviewCount.toString().padStart(3)}              │`);
  console.log('  └─────────────────────────────────────┘');
  console.log('\n  📧 All users have password: password123');
  console.log('  🔑 Team members: alice.chen@, bob.martinez@, charlie.kim@, diana.patel@, ethan.novak@company.com');
  console.log('  👔 Managers: sarah.johnson@, michael.torres@company.com\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
