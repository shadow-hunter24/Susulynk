const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

/**
 * Verifies the JWT and attaches req.user = { id, phone, email, fullName }
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, fullName: true, phone: true, email: true, isVerified: true },
    });

    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Checks req.user is ADMIN of the group specified by req.params.groupId
 * Must be used after authenticate()
 */
const requireAdmin = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    if (!groupId) return res.status(400).json({ error: 'groupId is required' });

    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId } },
      select: { role: true, status: true },
    });

    if (!membership) return res.status(403).json({ error: 'You are not a member of this group' });
    if (membership.status !== 'ACTIVE') return res.status(403).json({ error: 'Your membership is not active' });
    if (membership.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Checks req.user is an ACTIVE member (any role) of the group
 */
const requireMember = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.body.groupId;
    if (!groupId) return res.status(400).json({ error: 'groupId is required' });

    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: req.user.id, groupId } },
      select: { role: true, status: true },
    });

    if (!membership) return res.status(403).json({ error: 'You are not a member of this group' });
    if (membership.status !== 'ACTIVE') return res.status(403).json({ error: 'Your membership is not active' });

    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireAdmin, requireMember };
