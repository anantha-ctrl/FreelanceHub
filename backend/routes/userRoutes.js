const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { protect } = require('../middleware/authMiddleware');
const { User, Post, Like, Comment } = require('../models');
const { normalize } = require('../utils/dbUtils');

// Real-time notifications derived from live DB activity on the user's posts.
router.get('/notifications', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const myPosts = await Post.findAll({
      where: { userId, isDeleted: false },
      attributes: ['id', 'title', 'approvalStatus', 'rejectionReason', 'approvedAt', 'updatedAt']
    });
    const myPostIds = myPosts.map(p => p.id);
    const titleOf = {};
    myPosts.forEach(p => { titleOf[p.id] = p.title; });

    const notifications = [];

    if (myPostIds.length) {
      const [likes, comments] = await Promise.all([
        Like.findAll({
          where: { postId: { [Op.in]: myPostIds }, userId: { [Op.ne]: userId } },
          include: [{ model: User, as: 'user', attributes: ['name'] }],
          order: [['createdAt', 'DESC']], limit: 30
        }),
        Comment.findAll({
          where: { postId: { [Op.in]: myPostIds }, userId: { [Op.ne]: userId }, isDeleted: false },
          include: [{ model: User, as: 'user', attributes: ['name'] }],
          order: [['createdAt', 'DESC']], limit: 30
        })
      ]);

      likes.forEach(l => notifications.push({
        type: 'like', icon: '❤️',
        text: `${l.user?.name || 'Someone'} liked your post "${titleOf[l.postId] || ''}"`,
        time: l.createdAt
      }));

      comments.forEach(c => notifications.push({
        type: 'comment', icon: '💬',
        text: `${c.user?.name || 'Someone'} commented: "${(c.comment || '').slice(0, 80)}"`,
        time: c.createdAt
      }));
    }

    myPosts.forEach(p => {
      if (p.approvalStatus === 'approved') {
        notifications.push({
          type: 'approved', icon: '✅',
          text: `Your post "${p.title}" was approved by admin and is now live`,
          time: p.approvedAt || p.updatedAt
        });
      } else if (p.approvalStatus === 'rejected') {
        notifications.push({
          type: 'rejected', icon: '❌',
          text: `Your post "${p.title}" was rejected${p.rejectionReason ? ` — Reason: ${p.rejectionReason}` : ''}`,
          time: p.updatedAt
        });
      }
    });

    notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json({ success: true, notifications: notifications.slice(0, 50) });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: normalize(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
});

module.exports = router;
