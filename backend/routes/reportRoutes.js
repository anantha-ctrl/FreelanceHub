const express = require('express');
const router = express.Router();
const { submitReport, getMyReports } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', submitReport);
router.get('/my', getMyReports);

module.exports = router;
