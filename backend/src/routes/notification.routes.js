const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

// ── GET /api/notifications ── User's notifications ────────
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { groupId, unreadOnly } = req.query;

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
        ...(groupId && { groupId }),
        ...(unreadOnly === 'true' && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/notifications/:id/read ── Mark one as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/notifications/read-all ── Mark all as read
router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/notifications/:id ── Delete one
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
