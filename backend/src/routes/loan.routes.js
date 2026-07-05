const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate, requireAdmin, requireMember } = require('../middleware/auth.middleware');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  next();
};

// ── GET /api/loans/:groupId ── List loans ─────────────────
router.get('/:groupId', authenticate, requireMember, async (req, res, next) => {
  try {
    const { status, memberId } = req.query;
    const loans = await prisma.loan.findMany({
      where: {
        groupId: req.params.groupId,
        ...(status && { status }),
        ...(memberId && { memberId }),
      },
      include: {
        member: {
          include: { user: { select: { id: true, fullName: true, phone: true } } },
        },
        repayments: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Summary
    const totalOut = loans
      .filter(l => ['ACTIVE', 'OVERDUE'].includes(l.status))
      .reduce((s, l) => s + l.amount, 0);
    const totalOverdue = loans
      .filter(l => l.status === 'OVERDUE')
      .reduce((s, l) => s + l.amount, 0);
    const totalRepaid = loans
      .filter(l => l.status === 'REPAID')
      .reduce((s, l) => s + l.amount, 0);

    res.json({ loans, summary: { totalOut, totalOverdue, totalRepaid } });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/loans/:groupId/:loanId ── Loan detail ────────
router.get('/:groupId/:loanId', authenticate, requireMember, async (req, res, next) => {
  try {
    const loan = await prisma.loan.findFirst({
      where: { id: req.params.loanId, groupId: req.params.groupId },
      include: {
        member: { include: { user: { select: { id: true, fullName: true, phone: true } } } },
        repayments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/loans/:groupId/request ── Member requests own loan
router.post(
  '/:groupId/request',
  authenticate,
  requireMember,
  [
    body('amount').isFloat({ min: 50 }).withMessage('Minimum loan amount is GHS 50'),
    body('purpose').trim().notEmpty().withMessage('Loan purpose is required'),
    body('duration').optional().isInt({ min: 1 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { amount, purpose, notes, duration } = req.body;
      const { groupId } = req.params;

      const group = await prisma.group.findUnique({ where: { id: groupId } });
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (!group.allowLoans) return res.status(403).json({ error: 'This group does not allow loans' });

      // Find member record
      const member = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: req.user.id, groupId } },
      });

      // Check for existing active loan
      const activeLoan = await prisma.loan.findFirst({
        where: { memberId: member.id, groupId, status: { in: ['PENDING', 'ACTIVE', 'OVERDUE'] } },
      });
      if (activeLoan) {
        return res.status(409).json({ error: 'You already have an active or pending loan in this group' });
      }

      const rate      = group.interestRate;
      const principal = Number(amount);
      const totalDue  = parseFloat((principal * (1 + rate / 100)).toFixed(2));

      // Calculate due date
      const months  = Number(duration) || 3;
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + months);

      const loan = await prisma.loan.create({
        data: {
          memberId: member.id,
          groupId,
          amount:       principal,
          interestRate: rate,
          totalDue,
          purpose,
          notes:   notes || null,
          status:  'PENDING',
          dueDate,
        },
        include: { member: { include: { user: { select: { fullName: true } } } } },
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
          type:    'LOAN',
          title:   'Loan Request',
          message: `${req.user.fullName} requested a GHS ${principal} loan`,
        })),
      });

      res.status(201).json({ message: 'Loan request submitted. Awaiting admin approval.', loan });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/loans/:groupId ── Create loan request ───────
router.post(
  '/:groupId',
  authenticate,
  requireAdmin,
  [
    body('memberId').notEmpty().withMessage('memberId is required'),
    body('amount').isFloat({ min: 50 }).withMessage('Minimum loan amount is GHS 50'),
    body('purpose').trim().notEmpty().withMessage('Loan purpose is required'),
    body('interestRate').optional().isFloat({ min: 0, max: 100 }),
    body('dueDate').optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { memberId, amount, purpose, notes, interestRate, dueDate } = req.body;
      const { groupId } = req.params;

      const group = await prisma.group.findUnique({ where: { id: groupId } });
      if (!group) return res.status(404).json({ error: 'Group not found' });

      const rate = Number(interestRate ?? group.interestRate);
      const principal = Number(amount);
      const totalDue = principal * (1 + rate / 100);

      const member = await prisma.groupMember.findFirst({
        where: { id: memberId, groupId },
        include: { user: { select: { fullName: true } } },
      });
      if (!member) return res.status(404).json({ error: 'Member not found in this group' });

      const loan = await prisma.loan.create({
        data: {
          memberId,
          groupId,
          amount: principal,
          interestRate: rate,
          totalDue: parseFloat(totalDue.toFixed(2)),
          purpose,
          notes,
          status: 'PENDING',
          ...(dueDate && { dueDate: new Date(dueDate) }),
        },
        include: {
          member: { include: { user: { select: { fullName: true, phone: true } } } },
        },
      });

      await prisma.notification.create({
        data: {
          userId: req.user.id,
          groupId,
          type: 'LOAN',
          title: 'Loan Created',
          message: `GHS ${principal} loan created for ${member.user.fullName}`,
        },
      });

      res.status(201).json(loan);
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/loans/:groupId/:loanId ── Approve / update loan
router.patch('/:groupId/:loanId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, dueDate } = req.body;
    const data = {};
    if (status) data.status = status;
    if (dueDate) data.dueDate = new Date(dueDate);
    if (status === 'ACTIVE') data.approvedAt = new Date();

    const loan = await prisma.loan.update({
      where: { id: req.params.loanId },
      data,
      include: {
        member: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });

    // Notify the member when their loan is approved or rejected
    if (status === 'ACTIVE' || status === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId:  loan.member.user.id,
          groupId: req.params.groupId,
          type:    'LOAN',
          title:   status === 'ACTIVE' ? 'Loan Approved ✅' : 'Loan Request Declined',
          message: status === 'ACTIVE'
            ? `Your GHS ${loan.amount.toLocaleString()} loan has been approved. Due date: ${loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'TBD'}.`
            : `Your GHS ${loan.amount.toLocaleString()} loan request was not approved at this time.`,
        },
      });
    }

    res.json(loan);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/loans/:groupId/:loanId/repayments ── Record repayment (admin or loan owner)
router.post(
  '/:groupId/:loanId/repayments',
  authenticate,
  requireMember,
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    body('method').optional().isIn(['MOBILE_MONEY', 'CASH', 'BANK_TRANSFER']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { amount, method, reference, notes } = req.body;
      const { loanId, groupId } = req.params;

      const loan = await prisma.loan.findFirst({
        where: { id: loanId, groupId },
        include: {
          member: { include: { user: { select: { id: true, fullName: true } } } },
        },
      });
      if (!loan) return res.status(404).json({ error: 'Loan not found' });

      // Only the loan owner or an admin can submit repayments
      const isAdmin = req.membership?.role === 'ADMIN';
      const isOwner = loan.member.user.id === req.user.id;
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: 'You can only submit repayments for your own loans' });
      }

      if (['REPAID', 'REJECTED', 'PENDING'].includes(loan.status)) {
        return res.status(400).json({ error: `Cannot record repayment on a ${loan.status.toLowerCase()} loan` });
      }

      const repayment = await prisma.loanRepayment.create({
        data: { loanId, amount: Number(amount), method: method || 'MOBILE_MONEY', reference: reference || null, notes: notes || null },
      });

      const newRepaid = loan.amountRepaid + Number(amount);
      const newStatus = newRepaid >= loan.totalDue ? 'REPAID' : loan.status;
      await prisma.loan.update({
        where: { id: loanId },
        data: { amountRepaid: newRepaid, status: newStatus },
      });

      // If member submitted (not admin), notify admins for confirmation awareness
      if (isOwner && !isAdmin) {
        const admins = await prisma.groupMember.findMany({
          where: { groupId, role: 'ADMIN', status: 'ACTIVE' },
          select: { userId: true },
        });
        await prisma.notification.createMany({
          data: admins.map(a => ({
            userId:  a.userId,
            groupId,
            type:    'REPAYMENT',
            title:   'Loan Repayment Submitted',
            message: `${req.user.fullName} submitted a GHS ${amount} repayment`,
          })),
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: req.user.id,
            groupId,
            type:    'REPAYMENT',
            title:   'Loan Repayment',
            message: `${loan.member.user.fullName} made a GHS ${amount} repayment`,
          },
        });
      }

      res.status(201).json({ repayment, newAmountRepaid: newRepaid, loanStatus: newStatus });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
