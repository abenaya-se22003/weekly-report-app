require('dotenv').config();
const app = require('./app');
const prisma = require('./prisma');

const PORT = process.env.PORT || 3001;

// ─── Start Server ───────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Health:    http://localhost:${PORT}/api/health`);
  console.log(`   Stats:     http://localhost:${PORT}/api/stats`);
  console.log(`   Auth API:  http://localhost:${PORT}/api/auth`);
  console.log(`   Reports:   http://localhost:${PORT}/api/reports`);
  console.log(`   Projects:  http://localhost:${PORT}/api/projects`);
  console.log(`   Dashboard: http://localhost:${PORT}/api/dashboard`);
});

// ─── Graceful Shutdown ──────────────────────────────────────
const gracefulShutdown = async () => {
  console.log('\nShutting down server gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
