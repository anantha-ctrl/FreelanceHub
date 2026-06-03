const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  createTicket,
  getMyTickets,
  getTicketDetails,
  addMessage,
  adminGetTickets,
  adminGetTicketDetails,
  adminAddMessage,
  adminUpdateStatus
} = require('../controllers/supportController');

// Freelancer Support Routes
router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getMyTickets);
router.get('/tickets/:id', protect, getTicketDetails);
router.post('/tickets/:id/messages', protect, addMessage);

// Admin Support Routes
router.get('/admin/tickets', protect, adminOnly, adminGetTickets);
router.get('/admin/tickets/:id', protect, adminOnly, adminGetTicketDetails);
router.post('/admin/tickets/:id/messages', protect, adminOnly, adminAddMessage);
router.put('/admin/tickets/:id/status', protect, adminOnly, adminUpdateStatus);

module.exports = router;
