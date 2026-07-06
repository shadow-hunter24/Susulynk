const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // ── Prisma connection / pool errors ──────────────────────
  // These happen when Neon is waking from sleep or the pool is exhausted.
  // Return 503 so the client knows to retry, not treat it as a bad request.
  if (err instanceof Prisma.PrismaClientInitializationError ||
      err instanceof Prisma.PrismaClientRustPanicError) {
    return res.status(503).json({ error: 'Database unavailable. Please try again in a moment.' });
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    // Pool timeout messages come through here
    const msg = err.message || '';
    if (msg.includes('connection pool') || msg.includes('connect_timeout') || msg.includes('ConnectionReset')) {
      return res.status(503).json({ error: 'Database is waking up. Please try again in a few seconds.' });
    }
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001 = unreachable db, P1008 = timeout, P1017 = server closed connection
    if (['P1001', 'P1008', 'P1017'].includes(err.code)) {
      return res.status(503).json({ error: 'Database connection issue. Please try again shortly.' });
    }
    if (err.code === 'P2002') {
      const field = err.meta?.target?.[0] || 'field';
      return res.status(409).json({ error: `${field} already exists` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
    return res.status(400).json({ error: 'Database error', code: err.code });
  }

  // ── Validation errors (express-validator) ────────────────
  if (err.type === 'validation') {
    return res.status(422).json({ error: 'Validation failed', details: err.details });
  }

  // ── JWT errors ────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // ── Default ───────────────────────────────────────────────
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
};

const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };
