const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Susulynk database...');

  // Clean up
  await prisma.notification.deleteMany();
  await prisma.loanRepayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ─────────────────────────────────────────────
  const hashed = await bcrypt.hash('password123', 10);

  const kofi = await prisma.user.create({
    data: {
      fullName: 'Kofi Mensah',
      phone: '0241234567',
      email: 'kofi@susulynk.com',
      password: hashed,
      isVerified: true,
    },
  });

  const ama = await prisma.user.create({
    data: {
      fullName: 'Ama Owusu',
      phone: '0241234568',
      email: 'ama@susulynk.com',
      password: hashed,
      isVerified: true,
    },
  });

  const kwame = await prisma.user.create({
    data: {
      fullName: 'Kwame Asante',
      phone: '0551234567',
      password: hashed,
      isVerified: true,
    },
  });

  const abena = await prisma.user.create({
    data: {
      fullName: 'Abena Sarpong',
      phone: '0271234567',
      password: hashed,
      isVerified: true,
    },
  });

  const yaw = await prisma.user.create({
    data: {
      fullName: 'Yaw Darko',
      phone: '0201234567',
      password: hashed,
      isVerified: true,
    },
  });

  // ── Group ──────────────────────────────────────────────
  const group = await prisma.group.create({
    data: {
      name: 'Accra Women Susu',
      description: 'A monthly rotating savings group based in Accra',
      contributionAmount: 200,
      cycleType: 'Monthly',
      payoutDay: '15th',
      interestRate: 5,
      currency: 'GHS',
    },
  });

  // ── Group Members ──────────────────────────────────────
  const kofiMember = await prisma.groupMember.create({
    data: { userId: kofi.id, groupId: group.id, role: 'ADMIN', status: 'ACTIVE' },
  });
  const amaMember = await prisma.groupMember.create({
    data: { userId: ama.id, groupId: group.id, role: 'MEMBER', status: 'ACTIVE' },
  });
  const kwameMember = await prisma.groupMember.create({
    data: { userId: kwame.id, groupId: group.id, role: 'MEMBER', status: 'ACTIVE' },
  });
  const abenaMember = await prisma.groupMember.create({
    data: { userId: abena.id, groupId: group.id, role: 'MEMBER', status: 'ACTIVE' },
  });
  const yawMember = await prisma.groupMember.create({
    data: { userId: yaw.id, groupId: group.id, role: 'MEMBER', status: 'INACTIVE' },
  });

  // ── Contributions ──────────────────────────────────────
  const now = new Date();
  const contributions = [
    { memberId: amaMember.id, amount: 200, status: 'PAID', method: 'MOBILE_MONEY', cycle: 'June 2026', paidAt: now },
    { memberId: kwameMember.id, amount: 200, status: 'PAID', method: 'CASH', cycle: 'June 2026', paidAt: now },
    { memberId: abenaMember.id, amount: 200, status: 'PAID', method: 'MOBILE_MONEY', cycle: 'June 2026', paidAt: now },
    { memberId: yawMember.id, amount: 200, status: 'PENDING', cycle: 'June 2026' },
    { memberId: kofiMember.id, amount: 200, status: 'PAID', method: 'MOBILE_MONEY', cycle: 'June 2026', paidAt: now },
    { memberId: amaMember.id, amount: 200, status: 'PAID', method: 'MOBILE_MONEY', cycle: 'May 2026', paidAt: new Date('2026-05-20') },
    { memberId: kwameMember.id, amount: 200, status: 'PAID', method: 'CASH', cycle: 'May 2026', paidAt: new Date('2026-05-20') },
  ];

  for (const c of contributions) {
    await prisma.contribution.create({ data: { ...c, groupId: group.id } });
  }

  // ── Loans ──────────────────────────────────────────────
  const loan1 = await prisma.loan.create({
    data: {
      memberId: abenaMember.id,
      groupId: group.id,
      amount: 1000,
      interestRate: 5,
      totalDue: 1050,
      amountRepaid: 500,
      status: 'ACTIVE',
      purpose: 'Business expansion',
      dueDate: new Date('2026-08-01'),
      approvedAt: new Date('2026-06-01'),
    },
  });

  await prisma.loanRepayment.create({
    data: { loanId: loan1.id, amount: 300, method: 'MOBILE_MONEY', reference: 'MM123456' },
  });
  await prisma.loanRepayment.create({
    data: { loanId: loan1.id, amount: 200, method: 'CASH' },
  });

  await prisma.loan.create({
    data: {
      memberId: yawMember.id,
      groupId: group.id,
      amount: 500,
      interestRate: 5,
      totalDue: 525,
      amountRepaid: 525,
      status: 'REPAID',
      purpose: 'Medical expenses',
      dueDate: new Date('2026-07-10'),
      approvedAt: new Date('2026-05-10'),
    },
  });

  // ── Payouts ────────────────────────────────────────────
  const members = [amaMember, kwameMember, abenaMember, yawMember, kofiMember];
  const months = ['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026'];

  for (let i = 0; i < members.length; i++) {
    await prisma.payout.create({
      data: {
        memberId: members[i].id,
        groupId: group.id,
        amount: 1000,
        status: i < 4 ? 'PAID' : 'CURRENT',
        month: months[i],
        position: i + 1,
        paidAt: i < 4 ? new Date(`2026-0${i + 1}-28`) : null,
      },
    });
  }

  // ── Notifications ──────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: kofi.id,
        groupId: group.id,
        type: 'CONTRIBUTION',
        title: 'Contribution Received',
        message: 'Ama Owusu paid GHS 200 for June 2026',
      },
      {
        userId: kofi.id,
        groupId: group.id,
        type: 'LOAN',
        title: 'Loan Request',
        message: 'Kwame Asante requested a GHS 800 loan',
      },
      {
        userId: kofi.id,
        groupId: group.id,
        type: 'PAYOUT',
        title: 'Payout Due',
        message: "This month's payout is due for Kofi Mensah",
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log(`   Group: ${group.name} (${group.id})`);
  console.log(`   Users: 5 created`);
  console.log(`   Admin login — phone: 0241234567, password: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
