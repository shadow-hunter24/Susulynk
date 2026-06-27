/**
 * clear.js — Wipes all data from the database.
 * Run with: node prisma/clear.js
 *
 * Safe to run anytime. Does NOT drop tables or change schema.
 * Order matters — delete children before parents to avoid FK violations.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing all Susulynk data...');

  const [n, lr, l, p, c, gm, g, u] = await Promise.all([
    prisma.notification.deleteMany(),
    prisma.loanRepayment.deleteMany(),
    prisma.loan.deleteMany(),
    prisma.payout.deleteMany(),
    prisma.contribution.deleteMany(),
    prisma.groupMember.deleteMany(),
    prisma.group.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('✅ Database cleared:');
  console.log(`   ${u.count} users`);
  console.log(`   ${g.count} groups`);
  console.log(`   ${gm.count} group members`);
  console.log(`   ${c.count} contributions`);
  console.log(`   ${l.count} loans`);
  console.log(`   ${lr.count} loan repayments`);
  console.log(`   ${p.count} payouts`);
  console.log(`   ${n.count} notifications`);
  console.log('\n🚀 Ready for real data. Start the server and register your first user.');
}

main()
  .catch((e) => {
    console.error('❌ Clear failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
