const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

// ── Helpers ───────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// ── POST /api/auth/register ───────────────────────────────
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required')
      .matches(/^0[2-9]\d{8}$/).withMessage('Enter a valid Ghanaian phone number'),
    body('email').optional().isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('groupName').optional().trim(),
    body('groupRole').optional().isIn(['member', 'admin']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { fullName, phone, email, password, groupName, groupRole } = req.body;

      // Check phone uniqueness
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) return res.status(409).json({ error: 'Phone number already registered' });

      const hashed = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { fullName, phone, email: email || null, password: hashed, isVerified: true },
        select: { id: true, fullName: true, phone: true, email: true },
      });

      // Optionally create a group
      let group = null;
      if (groupName) {
        group = await prisma.group.create({
          data: {
            name: groupName,
            members: {
              create: {
                userId: user.id,
                role: groupRole === 'admin' ? 'ADMIN' : 'MEMBER',
              },
            },
          },
          select: { id: true, name: true },
        });
      }

      const token = signToken(user.id);
      res.status(201).json({ message: 'Account created', token, user, group });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────
router.post(
  '/login',
  [
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { phone, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { phone },
        include: {
          memberships: {
            include: { group: { select: { id: true, name: true } } },
          },
        },
      });

      if (!user) return res.status(401).json({ error: 'Invalid phone or password' });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: 'Invalid phone or password' });

      const token = signToken(user.id);
      const { password: _, ...safeUser } = user;
      res.json({ message: 'Login successful', token, user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/forgot-password ───────────────────────
router.post(
  '/forgot-password',
  [body('phone').trim().notEmpty().withMessage('Phone number is required')],
  validate,
  async (req, res, next) => {
    try {
      const { phone } = req.body;
      const user = await prisma.user.findUnique({ where: { phone } });

      // Always return 200 to avoid phone enumeration
      if (!user) {
        return res.json({ message: 'If that number is registered, an OTP has been sent' });
      }

      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode: otp, otpExpiry },
      });

      // TODO: integrate SMS provider (e.g. Hubtel, Twilio) to send OTP
      console.log(`[OTP] ${phone} → ${otp}`); // dev only

      res.json({ message: 'If that number is registered, an OTP has been sent', _dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/verify-otp ─────────────────────────────
router.post(
  '/verify-otp',
  [
    body('phone').trim().notEmpty(),
    body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { phone, otp } = req.body;
      const user = await prisma.user.findUnique({ where: { phone } });

      if (!user || user.otpCode !== otp) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }
      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(400).json({ error: 'OTP has expired. Request a new one.' });
      }

      // Issue a short-lived reset token
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'reset' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Clear OTP
      await prisma.user.update({
        where: { id: user.id },
        data: { otpCode: null, otpExpiry: null },
      });

      res.json({ message: 'OTP verified', resetToken });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/reset-password ────────────────────────
router.post(
  '/reset-password',
  [
    body('resetToken').notEmpty(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { resetToken, password } = req.body;

      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      } catch {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      if (decoded.purpose !== 'reset') {
        return res.status(400).json({ error: 'Invalid reset token' });
      }

      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id: decoded.userId }, data: { password: hashed } });

      res.json({ message: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, fullName: true, phone: true, email: true,
        bio: true, avatarUrl: true, isVerified: true, createdAt: true,
        memberships: {
          include: {
            group: { select: { id: true, name: true, contributionAmount: true, currency: true } },
          },
        },
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/auth/profile ───────────────────────────────
router.patch(
  '/profile',
  authenticate,
  [
    body('fullName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('bio').optional().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { fullName, email, bio } = req.body;
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(fullName && { fullName }),
          ...(email !== undefined && { email }),
          ...(bio !== undefined && { bio }),
        },
        select: { id: true, fullName: true, phone: true, email: true, bio: true },
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /api/auth/change-password ──────────────────────
router.patch(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

      res.json({ message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
