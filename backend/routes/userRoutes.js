const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { protect } = require('../middleware/authMiddleware');
const { User, Post, Like, Comment, Message, Proposal } = require('../models');
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

    // Fetch received chat messages
    const chatMessages = await Message.findAll({
      where: { receiverId: userId },
      include: [{ model: User, as: 'sender', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: 30
    });

    chatMessages.forEach(m => {
      notifications.push({
        type: 'message',
        icon: '💬',
        text: `${m.sender?.name || 'Someone'} sent you a message: "${(m.message || '').slice(0, 60)}${m.message?.length > 60 ? '...' : ''}"`,
        time: m.createdAt
      });
    });

    // Fetch received proposals (for client)
    let receivedProposals = [];
    if (myPostIds.length) {
      receivedProposals = await Proposal.findAll({
        where: { postId: { [Op.in]: myPostIds } },
        include: [
          { model: User, as: 'user', attributes: ['name'] },
          { model: Post, as: 'post', attributes: ['title'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 30
      });
    }

    receivedProposals.forEach(pr => {
      notifications.push({
        type: 'proposal_received',
        icon: '📥',
        text: `${pr.user?.name || 'Someone'} submitted a proposal for your post "${pr.post?.title || titleOf[pr.postId] || ''}" (Pitch: ${pr.bidAmount})`,
        time: pr.createdAt
      });
    });

    // Fetch submitted proposal status updates (for freelancer)
    const myProposalsWithStatus = await Proposal.findAll({
      where: { 
        userId, 
        status: { [Op.in]: ['accepted', 'rejected'] } 
      },
      include: [
        { 
          model: Post, 
          as: 'post', 
          attributes: ['title'],
          include: [{ model: User, as: 'user', attributes: ['name'] }] 
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 30
    });

    myProposalsWithStatus.forEach(pr => {
      const clientName = pr.post?.user?.name || 'the client';
      const statusIcon = pr.status === 'accepted' ? '✅' : '❌';
      notifications.push({
        type: `proposal_${pr.status}`,
        icon: statusIcon,
        text: `Your proposal for "${pr.post?.title || ''}" was ${pr.status} by ${clientName}`,
        time: pr.updatedAt
      });
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
