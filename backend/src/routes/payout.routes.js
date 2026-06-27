const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin, requireMember } = require('../middleware/auth.middleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  next();
};

// ── GET /api/payouts/:groupId ── Full rotation list ───────
router.get('/:groupId', authenticate, requireMember, async (req, res, next) => {
  try {
    const payouts = await prisma.payout.findMany({
      where: { groupId: req.params.groupId },
      include: {
        member: {
          include: { user: { select: { id: true, fullName: true, phone: true } } },
        },
      },
      orderBy: { position: 'asc' },
    });

    const current = payouts.find(p => p.status === 'CURRENT');
    const paidCount = payouts.filter(p => p.status === 'PAID').length;

    res.json({ payouts, current, paidCount, totalSlots: payouts.length });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/payouts/:groupId ── Create payout schedule ──
router.post(
  '/:groupId',
  authenticate,
  requireAdmin,
  [
    body('slots').isArray({ min: 1 }).withMessage('slots must be an array of { memberId, month, position }'),
    body('amount').isFloat({ min: 1 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { slots, amount } = req.body;
      const { groupId } = req.params;

      // Create all slots
      const payouts = await Promise.all(
        slots.map((slot, i) =>
          prisma.payout.create({
            data: {
              groupId,
              memberId: slot.memberId,
              amount: Number(amount),
              month: slot.month,
              position: slot.position || i + 1,
              status: i === 0 ? 'CURRENT' : 'UPCOMING',
            },
          })
        )
      );

      res.status(201).json(payouts);
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/payouts/:groupId/:payoutId/pay ── Mark payout as paid
router.patch('/:groupId/:payoutId/pay', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { groupId, payoutId } = req.params;

    const payout = await prisma.payout.findFirst({
      where: { id: payoutId, groupId, status: 'CURRENT' },
      include: { member: { include: { user: { select: { fullName: true } } } } },
    });
    if (!payout) return res.status(404).json({ error: 'No current payout found' });

    // Mark current as paid
    await prisma.payout.update({
      where: { id: payoutId },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // Find the next upcoming and make it current
    const nextUpcoming = await prisma.payout.findFirst({
      where: { groupId, status: 'UPCOMING' },
      orderBy: { position: 'asc' },
    });

    if (nextUpcoming) {
      await prisma.payout.update({
        where: { id: nextUpcoming.id },
        data: { status: 'CURRENT' },
      });
    }

    // Notification
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        groupId,
        type: 'PAYOUT',
        title: 'Payout Completed',
        message: `Payout of GHS ${payout.amount} paid to ${payout.member.user.fullName}`,
      },
    });

    res.json({ message: 'Payout marked as paid', nextPayout: nextUpcoming });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/payouts/:groupId/reorder ── Reorder rotation
router.patch(
  '/:groupId/reorder',
  authenticate,
  requireAdmin,
  [body('order').isArray({ min: 1 }).withMessage('order must be an array of { payoutId, position }')],
  validate,
  async (req, res, next) => {
    try {
      const { order } = req.body;
      await Promise.all(
        order.map(({ payoutId, position }) =>
          prisma.payout.update({ where: { id: payoutId }, data: { position } })
        )
      );
      res.json({ message: 'Rotation order updated' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
