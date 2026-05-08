const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middlewares/auth.middleware');
const { uploadImage, setUploadFolder } = require('../middlewares/upload.middleware');
const contentController = require('../controllers/admin/contentController');
const planController = require('../controllers/admin/planController');
const orderWorkflowController = require('../controllers/admin/orderWorkflowController');
const adminUserController = require('../controllers/admin/adminUserController');
const configController = require('../controllers/admin/configController');
const nfcTemplateController = require('../controllers/admin/nfcTemplateController');
const postPurchaseController = require('../controllers/admin/postPurchaseController');
const subscriptionController = require('../controllers/admin/subscriptionController');

/**
 * NFC TEMPLATE ROUTES
 */

router.get('/nfc-templates',
    verifyToken,
    authorizeRole('admin'),
    nfcTemplateController.getAllNfcTemplates
);

router.get('/nfc-templates/:id',
    verifyToken,
    authorizeRole('admin'),
    nfcTemplateController.getNfcTemplateById
);

router.post('/nfc-templates',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('nfc_templates'),
    uploadImage.array('images', 10),
    nfcTemplateController.createNfcTemplate
);

router.put('/nfc-templates/:id',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('nfc_templates'),
    uploadImage.array('images', 10),
    nfcTemplateController.updateNfcTemplate
);

router.delete('/nfc-templates/:id',
    verifyToken,
    authorizeRole('admin'),
    nfcTemplateController.deleteNfcTemplate
);

router.patch('/nfc-templates/:id/status',
    verifyToken,
    authorizeRole('admin'),
    nfcTemplateController.updateNfcTemplateStatus
);

router.patch('/nfc-templates/:id/recommendation',
    verifyToken,
    authorizeRole('admin'),
    nfcTemplateController.updateNfcTemplateRecommendation
);

/**
 * CARD TEMPLATE ROUTES
 */
const cardTemplateController = require('../controllers/admin/cardTemplateController');

router.get('/card-templates',
    verifyToken,
    authorizeRole('admin'),
    cardTemplateController.getAllCardTemplates
);

router.get('/card-templates/:id',
    verifyToken,
    authorizeRole('admin'),
    cardTemplateController.getCardTemplateById
);

router.post('/card-templates',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('card_templates'),
    uploadImage.array('images', 10),
    cardTemplateController.createCardTemplate
);

router.put('/card-templates/:id',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('card_templates'),
    uploadImage.array('images', 10),
    cardTemplateController.updateCardTemplate
);

router.delete('/card-templates/:id',
    verifyToken,
    authorizeRole('admin'),
    cardTemplateController.deleteCardTemplate
);

router.patch('/card-templates/:id/status',
    verifyToken,
    authorizeRole('admin'),
    cardTemplateController.updateCardTemplateStatus
);

router.patch('/card-templates/:id/recommendation',
    verifyToken,
    authorizeRole('admin'),
    cardTemplateController.updateCardTemplateRecommendation
);

/**
 * EVENT CATEGORY ROUTES
 */
const categoryController = require('../controllers/admin/categoryController');

router.get('/categories',
    verifyToken,
    authorizeRole('admin'),
    categoryController.getAllCategories
);

router.get('/categories/:id',
    verifyToken,
    authorizeRole('admin'),
    categoryController.getCategoryById
);

router.post('/categories',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('event_categories'),
    uploadImage.single('icon'),
    categoryController.createCategory
);

router.put('/categories/:id',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('event_categories'),
    uploadImage.single('icon'),
    categoryController.updateCategory
);

router.delete('/categories/:id',
    verifyToken,
    authorizeRole('admin'),
    categoryController.deleteCategory
);

router.patch('/categories/:id/status',
    verifyToken,
    authorizeRole('admin'),
    categoryController.updateCategoryStatus
);

/**
 * CONFIGURATION MANAGEMENT ROUTES
 */

router.get('/config',
    verifyToken,
    authorizeRole('admin'),
    configController.getAllConfigs
);

router.put('/config',
    verifyToken,
    authorizeRole('admin'),
    configController.updateConfigs
);

/**
 * USER MANAGEMENT ROUTES
 */

router.get('/users',
    verifyToken,
    authorizeRole('admin'),
    adminUserController.getAllUsers
);

router.get('/users/:id',
    verifyToken,
    authorizeRole('admin'),
    adminUserController.getUserById
);

router.patch('/users/:id/status',
    verifyToken,
    authorizeRole('admin'),
    adminUserController.updateUserStatus
);

router.delete('/users/:id',
    verifyToken,
    authorizeRole('admin'),
    adminUserController.deleteUser
);

/**
 * TICKET MANAGEMENT ROUTES
 */

router.get('/tickets',
    verifyToken,
    authorizeRole('admin'),
    adminUserController.getAllTickets
);

router.get('/tickets/:id',
    verifyToken,
    authorizeRole('admin'),
    adminUserController.getTicketById
);

router.post('/tickets',
    verifyToken,
    authorizeRole('admin'),
    adminUserController.createTicket
);

router.put('/tickets/:id',
    verifyToken,
    authorizeRole('admin'),
    adminUserController.updateTicket
);

/**
 * CONTENT MANAGEMENT ROUTES
 * All routes require both authentication and admin role
 */

// --- Get all pages content (paginated)
router.get('/content', 
    verifyToken, 
    authorizeRole('admin'),
    contentController.getAllPagesContent
);

// --- Get specific page content
router.get('/content/:pageSlug', 
    verifyToken, 
    authorizeRole('admin'),
    contentController.getPageContent
);

// --- Save or update page content
router.post('/content/:pageSlug', 
    verifyToken, 
    authorizeRole('admin'),
    contentController.savePageContent
);

// --- Delete page content
router.delete('/content/:pageSlug', 
    verifyToken, 
    authorizeRole('admin'),
    contentController.deletePageContent
);

/**
 * PRODUCT PLAN MANAGEMENT ROUTES
 * All routes require both authentication and admin role
 */

// --- Get all plans (admin - includes inactive plans)
router.get('/plans',
    verifyToken,
    authorizeRole('admin'),
    planController.getAllPlans
);

// --- Get specific plan details
router.get('/plans/:id',
    verifyToken,
    authorizeRole('admin'),
    planController.getPlanById
);

// --- Create new plan
router.post('/plans',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('plan_icons'),
    uploadImage.single('icon'),
    planController.createPlan
);

// --- Update plan
router.put('/plans/:id',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('plan_icons'),
    uploadImage.single('icon'),
    planController.updatePlan
);

// --- Delete plan
router.delete('/plans/:id',
    verifyToken,
    authorizeRole('admin'),
    planController.deletePlan
);

/**
 * ORDER MANAGEMENT & TRACKING ROUTES
 */

router.get('/orders',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.getAllOrders
);

router.get('/orders/:id',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.getOrderById
);

router.patch('/orders/:id/status',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.updateOrderStatus
);

router.get('/tracking-notes',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.getRecentTrackingNotes
);

router.post('/orders/:orderId/nfc-issuances',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.createNFCCardIssuance
);

router.get('/orders/:orderId/nfc-issuances',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.getOrderNFCCardIssuances
);

router.post('/orders/:orderId/tracking-notes',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.createOrderTrackingNote
);

router.get('/orders/:orderId/tracking-notes',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.getOrderTrackingNotes
);

/**
 * PAYMENT ROUTES
 */

router.post('/payments',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.recordPayment
);

router.get('/orders/:orderId/payments',
    verifyToken,
    authorizeRole('admin'),
    orderWorkflowController.getOrderPayments
);

/**
 * POST-PURCHASE CATEGORY ROUTES
 */

router.get('/pp-categories',
    verifyToken,
    authorizeRole('admin'),
    postPurchaseController.getAllPPCategories
);

router.get('/pp-categories/:id',
    verifyToken,
    authorizeRole('admin'),
    postPurchaseController.getPPCategoryById
);

router.post('/pp-categories',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('event_categories'),
    uploadImage.single('icon'),
    postPurchaseController.createPPCategory
);

router.put('/pp-categories/:id',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('event_categories'),
    uploadImage.single('icon'),
    postPurchaseController.updatePPCategory
);

router.patch('/pp-categories/:id/status',
    verifyToken,
    authorizeRole('admin'),
    postPurchaseController.updatePPCategoryStatus
);

router.delete('/pp-categories/:id',
    verifyToken,
    authorizeRole('admin'),
    postPurchaseController.deletePPCategory
);

/**
 * POST-PURCHASE PRODUCT ROUTES
 */

router.get('/pp-products',
    verifyToken,
    authorizeRole('admin'),
    postPurchaseController.getAllPPProducts
);

router.get('/pp-products/:id',
    verifyToken,
    authorizeRole('admin'),
    postPurchaseController.getPPProductById
);

router.post('/pp-products',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('post_purchase'),
    uploadImage.array('images', 5),
    postPurchaseController.createPPProduct
);

router.put('/pp-products/:id',
    verifyToken,
    authorizeRole('admin'),
    setUploadFolder('post_purchase'),
    uploadImage.array('images', 5),
    postPurchaseController.updatePPProduct
);

router.patch('/pp-products/:id/status',
    verifyToken,
    authorizeRole('admin'),
    postPurchaseController.updatePPProductStatus
);

router.patch('/pp-products/:id/recommendation',
    verifyToken,
    authorizeRole('admin'),
    postPurchaseController.updatePPProductRecommendation
);

router.delete('/pp-products/:id',
    verifyToken,
    authorizeRole('admin'),
    postPurchaseController.deletePPProduct
);

/**
 * SUBSCRIPTION PLAN ROUTES
 */

router.get('/subscription-plans',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.getAllSubscriptionPlans
);

router.get('/subscription-plans/:id',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.getSubscriptionPlanById
);

router.post('/subscription-plans',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.createSubscriptionPlan
);

router.put('/subscription-plans/:id',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.updateSubscriptionPlan
);

router.patch('/subscription-plans/:id/status',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.updateSubscriptionPlanStatus
);

router.delete('/subscription-plans/:id',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.deleteSubscriptionPlan
);

/**
 * USER SUBSCRIPTION ROUTES
 */

router.get('/subscriptions',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.getAllUserSubscriptions
);

router.post('/subscriptions/assign',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.assignSubscription
);

router.patch('/subscriptions/:id/status',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.updateSubscriptionStatus
);

router.post('/subscription-payments',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.recordSubscriptionPayment
);

router.get('/subscriptions/:subscription_id/payments',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.getSubscriptionPayments
);

router.get('/expired-subscriptions',
    verifyToken,
    authorizeRole('admin'),
    subscriptionController.getExpiredSubscriptions
);

module.exports = router;
