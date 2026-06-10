const express = require('express');
const router = express.Router();
const { getMyNotifications, getUnreadCount, markRead, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

module.exports = router;
