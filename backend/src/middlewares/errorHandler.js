/**
 * Centralized Express error handler middleware.
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Handler]', err);

  // Handle Prisma unique constraint violations (e.g., P2002)
  if (err.code === 'P2002') {
    const target = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      error: `Conflict: A record with this ${target} already exists.`,
    });
  }

  // Handle Prisma record not found (e.g., P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found: The requested resource does not exist.',
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
