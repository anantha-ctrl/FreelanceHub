const { SupportTicket, SupportMessage, User } = require('../models');
const { Op } = require('sequelize');

// --- FREELANCER ACTIONS ---

// Create a new support ticket
const createTicket = async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Subject is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Initial message is required.' });
    }

    // Create the ticket
    const ticket = await SupportTicket.create({
      userId: req.user.id,
      subject: subject.trim(),
      status: 'open'
    });

    // Create the initial message
    const msg = await SupportMessage.create({
      ticketId: ticket.id,
      senderId: req.user.id,
      message: message.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket opened successfully.',
      ticket: {
        ...ticket.toJSON(),
        messages: [msg.toJSON()]
      }
    });
  } catch (err) {
    console.error('Create support ticket error:', err);
    res.status(500).json({ success: false, message: 'Failed to create support ticket.' });
  }
};

// Get freelancer's own tickets
const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({
      where: { userId: req.user.id },
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: SupportMessage,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    res.json({
      success: true,
      tickets
    });
  } catch (err) {
    console.error('Get my support tickets error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
};

// Get specific ticket details with message history
const getTicketDetails = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: SupportMessage,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name', 'profileImage', 'role']
            }
          ]
        }
      ],
      order: [[ { model: SupportMessage, as: 'messages' }, 'createdAt', 'ASC' ]]
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (err) {
    console.error('Get ticket details error:', err);
    res.status(500).json({ success: false, message: 'Failed to load ticket details.' });
  }
};

// Add a follow-up message to own ticket
const addMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const ticket = await SupportTicket.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot reply to a closed ticket.' });
    }

    // Re-open if resolved
    if (ticket.status === 'resolved') {
      await ticket.update({ status: 'open' });
    } else {
      // Touch updatedAt timestamp on ticket
      await ticket.changed('updatedAt', true);
      await ticket.save();
    }

    const msg = await SupportMessage.create({
      ticketId: ticket.id,
      senderId: req.user.id,
      message: message.trim()
    });

    const populatedMsg = await SupportMessage.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'profileImage', 'role'] }]
    });

    res.status(201).json({
      success: true,
      message: populatedMsg
    });
  } catch (err) {
    console.error('Add support message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};


// --- ADMIN ACTIONS ---

// Admin: list all tickets
const adminGetTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'profileImage', 'email', 'isOnline']
        },
        {
          model: SupportMessage,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    res.json({
      success: true,
      tickets
    });
  } catch (err) {
    console.error('Admin get tickets error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
};

// Admin: get ticket messages
const adminGetTicketDetails = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'profileImage', 'email', 'isOnline', 'mobile']
        },
        {
          model: SupportMessage,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'name', 'profileImage', 'role']
            }
          ]
        }
      ],
      order: [[ { model: SupportMessage, as: 'messages' }, 'createdAt', 'ASC' ]]
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (err) {
    console.error('Admin get ticket details error:', err);
    res.status(500).json({ success: false, message: 'Failed to load ticket details.' });
  }
};

// Admin: reply to ticket
const adminAddMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Cannot reply to a closed ticket.' });
    }

    // Touch updatedAt timestamp on ticket
    await ticket.changed('updatedAt', true);
    await ticket.save();

    const msg = await SupportMessage.create({
      ticketId: ticket.id,
      senderId: req.user.id,
      message: message.trim()
    });

    const populatedMsg = await SupportMessage.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'profileImage', 'role'] }]
    });

    res.status(201).json({
      success: true,
      message: populatedMsg
    });
  } catch (err) {
    console.error('Admin support reply error:', err);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// Admin: update ticket status (resolved, closed, open)
const adminUpdateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket status.' });
    }

    const ticket = await SupportTicket.findByPk(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    await ticket.update({ status });

    res.json({
      success: true,
      message: `Ticket status updated to ${status}.`,
      ticket
    });
  } catch (err) {
    console.error('Admin update status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update ticket status.' });
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getTicketDetails,
  addMessage,
  adminGetTickets,
  adminGetTicketDetails,
  adminAddMessage,
  adminUpdateStatus
};
