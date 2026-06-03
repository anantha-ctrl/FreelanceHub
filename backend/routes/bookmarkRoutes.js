const express = require('express');
const router = express.Router();
const { toggleBookmark, getBookmarks } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');

router.post('/:postId', protect, toggleBookmark);
router.get('/', protect, getBookmarks);

module.exports = router;
