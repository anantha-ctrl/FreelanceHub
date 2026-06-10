const express = require('express');
const router = express.Router();
const {
  getStats, getAllAds, deleteAd, getAllReports,
  getAllRequests, updateRequestStatus, broadcast, getAnalytics
} = require('../controllers/carAdminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly);
router.get('/stats', getStats);
router.get('/ads', getAllAds);
router.delete('/ads/:id', deleteAd);
router.get('/reports', getAllReports);
router.get('/file-requests', getAllRequests);
router.put('/file-requests/:id', updateRequestStatus);
router.post('/broadcast', broadcast);
router.get('/analytics', getAnalytics);

module.exports = router;
