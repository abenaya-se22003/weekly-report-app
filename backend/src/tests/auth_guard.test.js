const request = require('supertest');
const app = require('../app');
const prisma = require('../prisma');

describe('Security & Role-Based Access Control Tests', () => {
  let aliceToken;
  let aliceUser;
  let bobUser;
  let bobReport;
  let managerToken;
  let managerUser;

  beforeAll(async () => {
    // 1. Authenticate Alice (Team Member)
    const aliceRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice.chen@company.com', password: 'password123' });

    expect(aliceRes.status).toBe(200);
    aliceToken = aliceRes.body.token;
    aliceUser = aliceRes.body.user;

    // 2. Authenticate Sarah (Manager)
    const managerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah.johnson@company.com', password: 'password123' });

    expect(managerRes.status).toBe(200);
    managerToken = managerRes.body.token;
    managerUser = managerRes.body.user;

    // 3. Find Bob's report from DB
    bobUser = await prisma.user.findUnique({
      where: { email: 'bob.martinez@company.com' },
    });

    bobReport = await prisma.report.findFirst({
      where: { userId: bobUser.id },
    });

    expect(bobReport).toBeDefined();
    expect(bobReport.userId).not.toBe(aliceUser.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─── Requirement 1: Team member cannot GET another team member's report ───
  test("A team member CANNOT get another team member's report (returns 403)", async () => {
    const res = await request(app)
      .get(`/api/reports/${bobReport.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|permission|another team member/i);
  });

  test("A team member CANNOT view version history of another team member's report (returns 403)", async () => {
    const res = await request(app)
      .get(`/api/reports/${bobReport.id}/versions`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|another team member/i);
  });

  test("A team member CANNOT edit (PUT) another team member's report (returns 403)", async () => {
    const res = await request(app)
      .put(`/api/reports/${bobReport.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        content: { notes: 'Malicious edit attempt' },
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|cannot edit another/i);
  });

  // ─── Requirement 2: Team member cannot access manager-only endpoints ───
  test('A team member CANNOT access manager dashboard summary (returns 403)', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|MANAGER/i);
  });

  test('A team member CANNOT access manager dashboard charts (returns 403)', async () => {
    const res = await request(app)
      .get('/api/dashboard/charts')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|MANAGER/i);
  });

  test('A team member CANNOT review reports (returns 403)', async () => {
    const res = await request(app)
      .post(`/api/reports/${bobReport.id}/review`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        action: 'APPROVED',
        comment: 'Unauthorized approval attempt',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|MANAGER/i);
  });

  test('A team member CANNOT create a project (returns 403)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        name: 'Unauthorized Project',
        description: 'Should fail',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|MANAGER/i);
  });

  test('A team member CANNOT call AI Chat Assistant (returns 403)', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        message: 'What did the team work on last week?',
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/forbidden|MANAGER/i);
  });

  test('A manager CAN call AI Chat Assistant (returns 200 with synthesized reply)', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        message: 'What are the current blockers?',
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    expect(res.body.contextReportCount).toBeGreaterThan(0);
  });
});
