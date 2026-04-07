const express = require('express');
const router = express.Router();
const authController = require('../controllers/public/authController');
const contentController = require('../controllers/public/contentController');

// Registration routes
router.post('/register', authController.register);
router.post('/setup-password', authController.setupPassword);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Public content routes (No authentication required)
router.get('/content/:pageSlug', contentController.getPageContent);

module.exports = router;