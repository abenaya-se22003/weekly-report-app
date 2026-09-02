const express = require('express');
const cors = require('cors');
const prisma = require('./prisma');

const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const reportRoutes = require('./routes/report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ─── Global Middlewares ─────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health & Diagnostic Routes ─────────────────────────────
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

app.get('/api/stats', async (req, res) => {
  try {
    const [users, projects, reports, versions, reviews, tasks] = await Promise.all([
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

// ─── API Routes Mounting ────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Convenience aliases (in case requests are made without /api prefix)
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/reports', reportRoutes);
app.use('/dashboard', dashboardRoutes);

// ─── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Centralized Error Handler ─────────────────────────────
app.use(errorHandler);

module.exports = app;
