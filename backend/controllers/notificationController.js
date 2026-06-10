const { Notification } = require('../models');
const { normalize } = require('../utils/dbUtils');

// GET /api/notifications
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    const unread = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ success: true, notifications: normalize(notifications), unread });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const unread = await Notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ success: true, unread });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
};

// PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { id: req.params.id, userId: req.user.id } });
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.update({ isRead: true }, { where: { userId: req.user.id, isRead: false } });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
};

module.exports = { getMyNotifications, getUnreadCount, markRead, markAllRead };
