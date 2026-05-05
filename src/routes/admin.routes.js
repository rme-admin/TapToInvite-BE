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

module.exports = router;
