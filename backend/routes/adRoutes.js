const express = require('express');
const router = express.Router();
const { createAd, getMyAds, getAd, deleteAd } = require('../controllers/adController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', createAd);
router.get('/my', getMyAds);
router.get('/:id', getAd);
router.delete('/:id', deleteAd);

module.exports = router;
