const router = require('express').Router();
const { body, query, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin, requireMember } = require('../middleware/auth.middleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  next();
};

// ── GET /api/members/:groupId ── List members ─────────────
router.get('/:groupId', authenticate, requireMember, async (req, res, next) => {
  try {
    const { search, status } = req.query;

    // Default to ACTIVE members only; admins can pass status=ALL to see every record
    const isAdmin = req.membership?.role === 'ADMIN';
    let statusFilter;
    if (status === 'ALL' && isAdmin) {
      statusFilter = undefined; // no filter — return all statuses
    } else if (status) {
      statusFilter = status.toUpperCase();
    } else {
      statusFilter = 'ACTIVE'; // default: active members only
    }

    const members = await prisma.groupMember.findMany({
      where: {
        groupId: req.params.groupId,
        ...(statusFilter && { status: statusFilter }),
        ...(search && {
          user: {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          },
        }),
      },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true, avatarUrl: true },
        },
        _count: { select: { contributions: true, loans: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/members/:groupId/:memberId ── Member detail ──
router.get('/:groupId/:memberId', authenticate, requireMember, async (req, res, next) => {
  try {
    const member = await prisma.groupMember.findFirst({
      where: { id: req.params.memberId, groupId: req.params.groupId },
      include: {
        user: {
          select: { id: true, fullName: true, phone: true, email: true, bio: true, avatarUrl: true },
        },
        contributions: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        loans: {
          include: { repayments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/members/:groupId ── Add member to group ─────
router.post(
  '/:groupId',
  authenticate,
  requireAdmin,
  [
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('role').optional().isIn(['MEMBER', 'ADMIN']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { phone, role, notes } = req.body;
      const { groupId } = req.params;

      // Find or create the user by phone
      let user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        // Create a placeholder account (user can claim it later)
        const bcrypt = require('bcryptjs');
        const tempPassword = await bcrypt.hash(phone, 10);
        user = await prisma.user.create({
          data: {
            fullName: req.body.fullName || 'New Member',
            phone,
            email: req.body.email || null,
            password: tempPassword,
          },
        });
      }

      // Check not already a member
      const existing = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: user.id, groupId } },
      });
      if (existing) return res.status(409).json({ error: 'User is already a member of this group' });

      const member = await prisma.groupMember.create({
        data: {
          userId: user.id,
          groupId,
          role: role || 'MEMBER',
          notes,
        },
        include: { user: { select: { id: true, fullName: true, phone: true, email: true } } },
      });

      // Notify group admins
      await prisma.notification.create({
        data: {
          userId: req.user.id,
          groupId,
          type: 'MEMBER',
          title: 'New Member Added',
          message: `${user.fullName} was added to the group`,
        },
      });

      res.status(201).json(member);
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/members/:groupId/:memberId ── Update role/status
router.patch(
  '/:groupId/:memberId',
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      const { role, status, notes } = req.body;
      const updated = await prisma.groupMember.update({
        where: { id: req.params.memberId },
        data: {
          ...(role && { role }),
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
        },
        include: { user: { select: { id: true, fullName: true, phone: true } } },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/members/:groupId/:memberId ── Remove member
router.delete('/:groupId/:memberId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.groupMember.delete({ where: { id: req.params.memberId } });
    res.json({ message: 'Member removed from group' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
