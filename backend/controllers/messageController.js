const { Message, User } = require('../models');
const { Op } = require('sequelize');
const { normalize } = require('../utils/dbUtils');

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ success: false, message: 'Receiver ID and message content are required.' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ success: false, message: 'You cannot send a message to yourself.' });
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Receiver user not found.' });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message
    });

    res.status(201).json({ success: true, message: normalize(newMessage) });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all messages where user is sender or receiver
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    // Group by conversation partner
    const conversationsMap = {};
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      conversationsMap[partnerId] = {
        lastMessage: msg.message,
        lastMessageTime: msg.createdAt,
        unreadCount: (conversationsMap[partnerId]?.unreadCount || 0) + (msg.receiverId === userId && !msg.isRead ? 1 : 0)
      };
    }

    const partnerIds = Object.keys(conversationsMap);
    const partners = await User.findAll({
      where: { id: { [Op.in]: partnerIds } },
      attributes: ['id', 'name', 'profileImage', 'role', 'isOnline']
    });

    const list = partners.map(p => {
      const conv = conversationsMap[p.id];
      return {
        partner: normalize(p),
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount
      };
    }).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    res.json({ success: true, conversations: list });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations.' });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const partnerId = req.params.partnerId;

    // Mark incoming messages as read
    await Message.update(
      { isRead: true },
      {
        where: {
          senderId: partnerId,
          receiverId: userId,
          isRead: false
        }
      }
    );

    const history = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    res.json({ success: true, history: normalize(history) });
  } catch (err) {
    console.error('Get chat history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch chat history.' });
  }
};

module.exports = { sendMessage, getConversations, getChatHistory };
