const { PrismaClient } = require('@prisma/client');

// Build the database URL with connection pool tuning for Neon serverless.
// Neon free tier databases sleep after inactivity — the first connection after
// a cold-start can take several seconds. We raise the pool timeout and limit
// so Prisma waits long enough and doesn't exhaust connections under load.
const buildDatabaseUrl = () => {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL environment variable is not set');

  const url = new URL(base);
  // Increase pool size (default is 5 which is too tight for concurrent requests)
  url.searchParams.set('connection_limit', '10');
  // How long (seconds) Prisma waits for a free connection before throwing
  url.searchParams.set('pool_timeout', '30');
  // How long (seconds) an idle connection is kept alive — helps keep Neon warm
  url.searchParams.set('connect_timeout', '30');
  return url.toString();
};

// Singleton pattern — reuse a single PrismaClient across hot-reloads in dev
const createPrismaClient = () =>
  new PrismaClient({
    datasourceUrl: buildDatabaseUrl(),
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Graceful shutdown — release the connection pool cleanly
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
