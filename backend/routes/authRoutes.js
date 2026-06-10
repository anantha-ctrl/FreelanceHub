// authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, updateProfile, changePassword, forgotPassword, resetPassword, checkUsername } = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/username-available', checkUsername);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', optionalAuth, getMe);
router.put('/update-profile', protect, upload.single('image'), updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
