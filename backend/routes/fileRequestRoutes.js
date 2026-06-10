const express = require('express');
const router = express.Router();
const { getRanges, submitRequest, getMyRequests, downloadFile } = require('../controllers/fileRequestController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/ranges', getRanges);
router.post('/', submitRequest);
router.get('/my', getMyRequests);
router.get('/:id/download', downloadFile);

module.exports = router;
