const express = require('express');
const router = express.Router();
const { applyForJob, getPostProposals, getMyProposals, updateProposalStatus } = require('../controllers/proposalController');
const { protect } = require('../middleware/authMiddleware');

router.post('/apply/:postId', protect, applyForJob);
router.get('/post/:postId', protect, getPostProposals);
router.get('/my', protect, getMyProposals);
router.put('/:id/status', protect, updateProposalStatus);

module.exports = router;
