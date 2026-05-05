const express = require('express');
const router = express.Router();
const authController = require('../controllers/public/authController');
const contentController = require('../controllers/public/contentController');
const planController = require('../controllers/admin/planController');
const templatesController = require('../controllers/public/templatesController');
const inviteController = require('../controllers/public/inviteController');
const orderController = require('../controllers/user/orderController');
const { verifyToken } = require('../middlewares/auth.middleware');

// Registration routes
router.post('/register', authController.register);
router.post('/setup-password', authController.setupPassword);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Guest checkout route
router.post('/orders', orderController.placeGuestOrder);
router.post('/payments/razorpay/order', orderController.createRazorpayPaymentOrder);
router.post('/payments/razorpay/confirm', orderController.confirmPaidOrder);

// Razorpay webhook for payment notifications
router.post('/webhook/razorpay', orderController.razorpayWebhook);

// Public content routes (No authentication required)
router.get('/content/:pageSlug', contentController.getPageContent);

/**
 * PUBLIC PRODUCT PLAN ROUTES
 * No authentication required - returns only active plans
 */

// --- Get all active plans
router.get('/plans', planController.getActivePlans);

// --- Get specific active plan details
router.get('/plans/:id', planController.getPublicPlanById);

// --- Get plan with calculated pricing (base + cheapest templates)
router.get('/plans/:id/pricing', planController.getPlanWithPricing);

/**
 * PUBLIC TEMPLATE ROUTES
 * No authentication required - returns only active templates
 */

// --- NFC Templates
router.get('/nfc-templates', templatesController.getActiveNFCTemplates);
router.get('/nfc-templates/:id', templatesController.getNFCTemplateById);

// --- Normal Card Templates
router.get('/normal-templates', templatesController.getActiveNormalTemplates);
router.get('/normal-templates/:id', templatesController.getNormalTemplateById);

// --- Event Categories
router.get('/event-categories', templatesController.getActiveEventCategories);
router.get('/event-categories/:id', templatesController.getEventCategoryById);

// --- Post-Purchase Products (for guest experience)
router.get('/post-purchase-products', templatesController.getActivePostPurchaseProducts);
router.get('/post-purchase-products/:id', templatesController.getPostPurchaseProductById);

// --- Public invitation page by generated key
router.get('/invite/:key', inviteController.getPublicInviteByKey);

module.exports = router;