const express = require('express');
const router = express.Router();
const { getActive, getAll, create, update, remove } = require('../controllers/announcementController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getActive);
router.get('/all', protect, adminOnly, getAll);
router.post('/', protect, adminOnly, create);
router.put('/:id', protect, adminOnly, update);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
