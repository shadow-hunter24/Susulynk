const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin, requireMember } = require('../middleware/auth.middleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  next();
};

// ── POST /api/contributions/:groupId/submit ── Member submits own payment
router.post(
  '/:groupId/submit',
  authenticate,
  requireMember,
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('cycle').notEmpty().withMessage('Cycle is required'),
    body('method').optional().isIn(['MOBILE_MONEY', 'BANK_TRANSFER']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { amount, cycle, method, reference, notes } = req.body;
      const { groupId } = req.params;

      // Find the member record for the logged-in user in this group
      const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: req.user.id, groupId } },
      });
      if (!member) return res.status(404).json({ error: 'Member record not found' });

      // Check for existing contribution for this cycle (avoid duplicates)
      const existing = await prisma.contribution.findFirst({
        where: { memberId: member.id, groupId, cycle },
      });
      if (existing && existing.status === 'PAID') {
        return res.status(409).json({ error: `You have already paid for ${cycle}` });
      }

      // Reference is required — it's proof of the transfer
      if (!reference) {
        return res.status(422).json({ error: 'Transaction reference is required' });
      }

      // Create as PENDING — admin must confirm
      const contribution = await prisma.contribution.create({
        data: {
          memberId:  member.id,
          groupId,
          amount:    Number(amount),
          cycle,
          status:    'PENDING',
          method:    method || 'MOBILE_MONEY',
          reference: reference || null,
          notes:     notes || null,
        },
      });

      // Notify admins
      const admins = await prisma.groupMember.findMany({
        where: { groupId, role: 'ADMIN', status: 'ACTIVE' },
        select: { userId: true },
      });
      await prisma.notification.createMany({
        data: admins.map(a => ({
          userId:  a.userId,
          groupId,
          type:    'CONTRIBUTION',
          title:   'Payment Submitted',
          message: `${req.user.fullName} submitted GHS ${amount} for ${cycle} — awaiting confirmation`,
        })),
      });

      res.status(201).json({ message: 'Payment submitted. Awaiting admin confirmation.', contribution });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/contributions/:groupId/:id/confirm ── Admin confirms a submitted payment
router.patch('/:groupId/:id/confirm', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const contribution = await prisma.contribution.findFirst({
      where: { id: req.params.id, groupId: req.params.groupId },
      include: { member: { include: { user: { select: { id: true, fullName: true } } } } },
    });
    if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
    if (contribution.status === 'PAID') {
      return res.status(409).json({ error: 'Contribution is already confirmed as paid' });
    }

    const updated = await prisma.contribution.update({
      where: { id: req.params.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    // Notify the member their payment was confirmed
    await prisma.notification.create({
      data: {
        userId:  contribution.member.user.id,
        groupId: req.params.groupId,
        type:    'CONTRIBUTION',
        title:   'Payment Confirmed ✅',
        message: `Your GHS ${contribution.amount} contribution for ${contribution.cycle} has been confirmed.`,
      },
    });

    res.json({ message: 'Payment confirmed', contribution: updated });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/contributions/:groupId ── List contributions ─
router.get('/:groupId', authenticate, requireMember, async (req, res, next) => {
  try {
    const { cycle, status, memberId } = req.query;

    const contributions = await prisma.contribution.findMany({
      where: {
        groupId: req.params.groupId,
        ...(cycle && { cycle }),
        ...(status && { status }),
        ...(memberId && { memberId }),
      },
      include: {
        member: {
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute summary
    const paid = contributions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);
    const expected = contributions.length > 0
      ? contributions.length * (contributions[0].amount || 200)
      : 0;

    res.json({ contributions, summary: { paid, expected, outstanding: expected - paid } });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/contributions/:groupId ── Record contribution
router.post(
  '/:groupId',
  authenticate,
  requireAdmin,
  [
    body('memberId').notEmpty().withMessage('memberId is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('cycle').notEmpty().withMessage('Cycle (e.g. June 2026) is required'),
    body('method').optional().isIn(['MOBILE_MONEY', 'BANK_TRANSFER']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { memberId, amount, cycle, method, reference, notes } = req.body;
      const { groupId } = req.params;

      // Verify member belongs to this group
      const member = await prisma.groupMember.findFirst({
        where: { id: memberId, groupId },
        include: { user: { select: { fullName: true } } },
      });
      if (!member) return res.status(404).json({ error: 'Member not found in this group' });

      const contribution = await prisma.contribution.create({
        data: {
          memberId,
          groupId,
          amount: Number(amount),
          cycle,
          status: 'PAID',
          method: method || 'MOBILE_MONEY',
          reference,
          notes,
          paidAt: new Date(),
        },
        include: {
          member: { include: { user: { select: { fullName: true, phone: true } } } },
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          groupId,
          type: 'CONTRIBUTION',
          title: 'Contribution Recorded',
          message: `${member.user.fullName} paid GHS ${amount} for ${cycle}`,
        },
      });

      res.status(201).json(contribution);
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/contributions/:groupId/:id ── Update status
router.patch('/:groupId/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, reference, notes } = req.body;
    const updated = await prisma.contribution.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(reference !== undefined && { reference }),
        ...(notes !== undefined && { notes }),
        ...(status === 'PAID' && { paidAt: new Date() }),
      },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/contributions/:groupId/:id ── Delete
router.delete('/:groupId/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.contribution.delete({ where: { id: req.params.id } });
    res.json({ message: 'Contribution deleted' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/contributions/:groupId/reminders ── Admin sends contribution reminders
// Finds all members who haven't paid for the current cycle and creates REMINDER notifications
router.post('/:groupId/reminders', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { cycle } = req.body; // e.g. "July 2026"

    if (!cycle) return res.status(400).json({ error: 'cycle is required (e.g. "July 2026")' });

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    // Note: autoReminders flag only gates automated scheduled reminders — admin can always
    // send manual reminders regardless of that setting.

    // Get all active members
    const members = await prisma.groupMember.findMany({
      where: { groupId, status: 'ACTIVE' },
      include: { user: { select: { id: true, fullName: true } } },
    });

    // Get members who have already paid (PAID) or submitted (PENDING) for this cycle
    // — exclude both so we don't remind people who are awaiting confirmation
    const nonDebtorIds = (await prisma.contribution.findMany({
      where: { groupId, cycle, status: { in: ['PAID', 'PENDING'] } },
      select: { memberId: true },
    })).map(c => c.memberId);

    // Send reminders only to members who haven't paid or submitted yet
    const unpaidMembers = members.filter(m => !nonDebtorIds.includes(m.id));

    if (unpaidMembers.length === 0) {
      return res.json({ message: 'All members have paid or submitted payment for this cycle', reminded: 0 });
    }

    await prisma.notification.createMany({
      data: unpaidMembers.map(m => ({
        userId:  m.user.id,
        groupId,
        type:    'REMINDER',
        title:   '⏰ Contribution Reminder',
        message: `Your GHS ${group.contributionAmount} contribution for ${cycle} is due. Please pay soon to keep the group on track.`,
      })),
    });

    res.json({
      message: `Reminders sent to ${unpaidMembers.length} member${unpaidMembers.length !== 1 ? 's' : ''}`,
      reminded: unpaidMembers.length,
      members: unpaidMembers.map(m => m.user.fullName),
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/contributions/:groupId/cycles ── List cycles ─
router.get('/:groupId/meta/cycles', authenticate, requireMember, async (req, res, next) => {
  try {
    const cycles = await prisma.contribution.findMany({
      where: { groupId: req.params.groupId },
      select: { cycle: true },
      distinct: ['cycle'],
      orderBy: { createdAt: 'desc' },
    });
    res.json(cycles.map(c => c.cycle));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
