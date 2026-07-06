require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const groupRoutes = require('./routes/group.routes');
const memberRoutes = require('./routes/member.routes');
const contributionRoutes = require('./routes/contribution.routes');
const loanRoutes = require('./routes/loan.routes');
const payoutRoutes = require('./routes/payout.routes');
const notificationRoutes = require('./routes/notification.routes');
const reportRoutes = require('./routes/report.routes');

const { errorHandler } = require('./middleware/error.middleware');
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security & parsing middleware ────────────────────────
app.use(helmet());
app.use(cors({
  origin: '*',  // open for local dev — restrict to your domain in production
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Rate limiting ─────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many requests, please try again later.' },
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Susulynk API', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// ── 404 handler ───────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────────────────
app.use(errorHandler);

// ── Keep Neon alive ───────────────────────────────────────
// Neon free-tier databases sleep after ~5 min of inactivity.
// A lightweight ping every 4 minutes keeps the connection warm
// while the server is running, preventing cold-start timeouts.
const keepAlive = () => {
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (_) {
      // Silent — the next real request will reconnect automatically
    }
  }, 4 * 60 * 1000); // every 4 minutes
};

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Susulynk API running`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://10.50.89.192:${PORT}`);
  console.log(`   Health:  http://10.50.89.192:${PORT}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);

  // Warm up the database connection on startup so the first real request
  // doesn't hit a cold-start timeout
  try {
    await prisma.$connect();
    console.log('   Database: connected ✅');
    keepAlive();
  } catch (err) {
    console.error('   Database: connection failed ❌', err.message);
    console.error('   Check your DATABASE_URL in .env');
  }
});

module.exports = app;
