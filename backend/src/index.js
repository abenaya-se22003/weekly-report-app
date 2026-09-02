require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      message: error.message,
    });
  }
});

// ─── Quick stats endpoint (verifies seed data) ─────────
app.get('/api/stats', async (req, res) => {
  try {
    const [users, projects, reports, versions, reviews, tasks] =
      await Promise.all([
        prisma.user.count(),
        prisma.project.count(),
        prisma.report.count(),
        prisma.reportVersion.count(),
        prisma.reportReview.count(),
        prisma.taskEntry.count(),
      ]);

    res.json({ users, projects, reports, versions, reviews, tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Start Server ───────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Stats:  http://localhost:${PORT}/api/stats`);
});

// ─── Graceful Shutdown ──────────────────────────────────
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
