const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const { verifyToken } = require('../middlewares/auth.middleware');

// Apply verifyToken to all routes below
router.use(verifyToken);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Dashboard / Order history
router.get('/my-orders', userController.getMyOrders);

module.exports = router;