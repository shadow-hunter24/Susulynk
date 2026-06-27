const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, requireMember } = require('../middleware/auth.middleware');

// ── GET /api/reports/:groupId ── Monthly summary ──────────
router.get('/:groupId', authenticate, requireMember, async (req, res, next) => {
  try {
    const { cycle } = req.query; // e.g. "June 2026"
    const { groupId } = req.params;

    // Contributions for cycle
    const contribWhere = { groupId, ...(cycle && { cycle }) };
    const contributions = await prisma.contribution.findMany({ where: contribWhere });

    const totalCollected = contributions
      .filter(c => c.status === 'PAID')
      .reduce((s, c) => s + c.amount, 0);
    const totalExpected = contributions.reduce((s, c) => s + c.amount, 0);

    // Loans
    const loans = await prisma.loan.findMany({
      where: { groupId },
      include: { repayments: true },
    });
    const activeLoans = loans.filter(l => ['ACTIVE', 'OVERDUE'].includes(l.status));
    const totalLoansOut = activeLoans.reduce((s, l) => s + l.amount, 0);
    const totalRepayments = loans.reduce((s, l) => s + l.amountRepaid, 0);
    const overdueCount = loans.filter(l => l.status === 'OVERDUE').length;

    // Members
    const members = await prisma.groupMember.findMany({
      where: { groupId, status: 'ACTIVE' },
      include: {
        user: { select: { fullName: true } },
        contributions: { where: { ...(cycle && { cycle }), status: 'PAID' } },
      },
    });

    // Top contributors — by total paid
    const topContributors = members
      .map(m => ({
        memberId: m.id,
        name: m.user.fullName,
        totalPaid: m.contributions.reduce((s, c) => s + c.amount, 0),
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5);

    // Group health metrics
    const payOnTimeCount = contributions.filter(c => c.status === 'PAID').length;
    const payOnTimeRate = contributions.length > 0
      ? Math.round((payOnTimeCount / contributions.length) * 100)
      : 0;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { contributionAmount: true, currency: true },
    });

    res.json({
      cycle: cycle || 'All time',
      contributions: {
        total: contributions.length,
        collected: totalCollected,
        expected: totalExpected,
        outstanding: totalExpected - totalCollected,
        collectionRate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0,
      },
      loans: {
        totalOut: totalLoansOut,
        totalRepayments,
        overdueCount,
        activeCount: activeLoans.length,
      },
      members: {
        active: members.length,
        payOnTimeRate,
      },
      topContributors,
      groupHealth: {
        payOnTimeRate,
        overdueRate: loans.length > 0 ? Math.round((overdueCount / loans.length) * 100) : 0,
        averageContribution: group?.contributionAmount || 0,
        currency: group?.currency || 'GHS',
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/reports/:groupId/dashboard ── Dashboard stats
router.get('/:groupId/meta/dashboard', authenticate, requireMember, async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const [memberCount, activeLoans, allContribs, recentActivity] = await Promise.all([
      prisma.groupMember.count({ where: { groupId, status: 'ACTIVE' } }),
      prisma.loan.findMany({
        where: { groupId, status: { in: ['ACTIVE', 'OVERDUE'] } },
      }),
      prisma.contribution.findMany({ where: { groupId, status: 'PAID' } }),
      prisma.contribution.findMany({
        where: { groupId },
        include: { member: { include: { user: { select: { fullName: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const totalSavings = allContribs.reduce((s, c) => s + c.amount, 0);
    const totalLoansOut = activeLoans.reduce((s, l) => s + l.amount, 0);

    res.json({
      totalSavings,
      totalLoansOut,
      memberCount,
      activeLoansCount: activeLoans.length,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
