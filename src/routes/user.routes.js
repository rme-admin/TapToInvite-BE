const express = require('express');
const router = express.Router();
const userController = require('../controllers/user/userController');
const orderController = require('../controllers/user/orderController');
const { verifyToken } = require('../middlewares/auth.middleware');

// Apply verifyToken to all routes below
router.use(verifyToken);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Dashboard / Order history
router.get('/my-orders', userController.getMyOrders);
router.get('/subscriptions', userController.getMySubscriptions);
router.get('/support-content', userController.getSupportContent);

// Order routes
router.post('/orders', orderController.placeOrder);
router.post('/payments/razorpay/order', orderController.createRazorpayPaymentOrder);
router.post('/payments/razorpay/confirm', orderController.confirmPaidOrder);
router.get('/orders/:orderId', orderController.getOrderDetails);

// Product purchase routes (requires auth)
router.post('/products/buy', orderController.buyProduct);
router.post('/products/confirm-payment', orderController.confirmProductPayment);

// Catalog routes (for customizer UI)
router.get('/plans', orderController.getPlans);
router.get('/nfc-templates', orderController.getNFCTemplates);
router.get('/normal-templates', orderController.getNormalTemplates);
router.get('/event-categories', orderController.getEventCategories);

module.exports = router;