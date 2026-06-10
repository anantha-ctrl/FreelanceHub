const express = require('express');
const router = express.Router();
const { getUserDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUserDashboard);

module.exports = router;
