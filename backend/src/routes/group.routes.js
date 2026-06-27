const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin, requireMember } = require('../middleware/auth.middleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  next();
};

// ── GET /api/groups/browse ── Discover public groups ─────
router.get('/browse', authenticate, async (req, res, next) => {
  try {
    const { search } = req.query;

    // Exclude groups the user already belongs to (any status)
    const myGroupIds = (await prisma.groupMember.findMany({
      where: { userId: req.user.id },
      select: { groupId: true },
    })).map(m => m.groupId);

    const groups = await prisma.group.findMany({
      where: {
        isPublic:   true,
        isArchived: false,
        id:         { notIn: myGroupIds },
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
      },
      include: {
        _count: { select: { members: true } },
        members: {
          where: { role: 'ADMIN' },
          take: 1,
          include: { user: { select: { fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(groups);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/groups/:groupId/request ── Request to join ─
router.post('/:groupId/request', authenticate, async (req, res, next) => {
  try {
    const { groupId } = req.params;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.isArchived) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check not already a member or pending
    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId } },
    });
    if (existing) {
      const msg = existing.status === 'PENDING'
        ? 'You already have a pending request for this group'
        : 'You are already a member of this group';
      return res.status(409).json({ error: msg });
    }

    if (group.requireApproval) {
      // Create a pending membership — admin must approve
      await prisma.groupMember.create({
        data: { userId: req.user.id, groupId, role: 'MEMBER', status: 'PENDING' },
      });

      // Notify the group admin(s)
      const admins = await prisma.groupMember.findMany({
        where: { groupId, role: 'ADMIN', status: 'ACTIVE' },
        select: { userId: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: req.user.id }, select: { fullName: true },
      });
      await prisma.notification.createMany({
        data: admins.map(a => ({
          userId:  a.userId,
          groupId,
          type:    'MEMBER',
          title:   'Join Request',
          message: `${user.fullName} wants to join ${group.name}`,
        })),
      });

      return res.status(201).json({ message: 'Join request sent. Awaiting admin approval.' });
    } else {
      // Auto-approve — add directly as active member
      const member = await prisma.groupMember.create({
        data: { userId: req.user.id, groupId, role: 'MEMBER', status: 'ACTIVE' },
        include: { group: { select: { id: true, name: true, contributionAmount: true, currency: true } } },
      });
      return res.status(201).json({ message: 'Joined successfully', member });
    }
  } catch (err) {
    next(err);
  }
});

// ── GET /api/groups/:groupId/requests ── List join requests (admin)
router.get('/:groupId/requests', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const requests = await prisma.groupMember.findMany({
      where: { groupId: req.params.groupId, status: 'PENDING' },
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/groups/:groupId/requests/:memberId ── Approve or reject
router.patch('/:groupId/requests/:memberId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    const { groupId, memberId } = req.params;

    const request = await prisma.groupMember.findFirst({
      where: { id: memberId, groupId, status: 'PENDING' },
      include: { user: { select: { id: true, fullName: true } } },
    });
    if (!request) return res.status(404).json({ error: 'Join request not found' });

    if (action === 'approve') {
      await prisma.groupMember.update({
        where: { id: memberId },
        data: { status: 'ACTIVE' },
      });
      // Notify the user
      await prisma.notification.create({
        data: {
          userId:  request.user.id,
          groupId,
          type:    'MEMBER',
          title:   'Request Approved',
          message: `Your request to join the group has been approved!`,
        },
      });
      return res.json({ message: `${request.user.fullName} approved` });
    } else if (action === 'reject') {
      await prisma.groupMember.delete({ where: { id: memberId } });
      await prisma.notification.create({
        data: {
          userId:  request.user.id,
          groupId,
          type:    'MEMBER',
          title:   'Request Declined',
          message: `Your request to join the group was not approved at this time.`,
        },
      });
      return res.json({ message: `${request.user.fullName} rejected` });
    } else {
      return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
    }
  } catch (err) {
    next(err);
  }
});

// ── POST /api/groups ── Create a group ────────────────────
router.post(
  '/',
  authenticate,
  [body('name').trim().notEmpty().withMessage('Group name is required')],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, contributionAmount, cycleType, payoutDay, currency } = req.body;
      const group = await prisma.group.create({
        data: {
          name,
          description,
          contributionAmount: Number(contributionAmount) || 200,
          cycleType: cycleType || 'Monthly',
          payoutDay: payoutDay || '15th',
          currency: currency || 'GHS',
          members: {
            create: { userId: req.user.id, role: 'ADMIN' },
          },
        },
      });
      res.status(201).json(group);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/groups/mine ── Groups the logged-in user belongs to
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: req.user.id },
      include: {
        group: {
          include: {
            _count: { select: { members: true, contributions: true, loans: true } },
          },
        },
      },
    });
    res.json(memberships);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/groups/:groupId ── Group details ─────────────
router.get('/:groupId', authenticate, requireMember, async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.groupId },
      include: {
        _count: { select: { members: true } },
      },
    });
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/groups/:groupId ── Update group settings ───
router.patch(
  '/:groupId',
  authenticate,
  requireAdmin,
  [body('name').optional().trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const {
        name, description, contributionAmount, cycleType,
        payoutDay, interestRate, allowLoans, requireApproval, autoReminders,
      } = req.body;

      const updated = await prisma.group.update({
        where: { id: req.params.groupId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(contributionAmount !== undefined && { contributionAmount: Number(contributionAmount) }),
          ...(cycleType && { cycleType }),
          ...(payoutDay && { payoutDay }),
          ...(interestRate !== undefined && { interestRate: Number(interestRate) }),
          ...(allowLoans !== undefined && { allowLoans }),
          ...(requireApproval !== undefined && { requireApproval }),
          ...(autoReminders !== undefined && { autoReminders }),
        },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/groups/:groupId/archive ── Archive group ──
router.patch('/:groupId/archive', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const group = await prisma.group.update({
      where: { id: req.params.groupId },
      data: { isArchived: true },
    });
    res.json({ message: 'Group archived', group });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
