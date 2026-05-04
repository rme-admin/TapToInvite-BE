const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middlewares/auth.middleware');
const { uploadImage, setUploadFolder } = require('../middlewares/upload.middleware');
const contentController = require('../controllers/admin/contentController');
const planController = require('../controllers/admin/planController');
const orderWorkflowController = require('../controllers/admin/orderWorkflowController');

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
 * NFC ISSUANCE & ORDER TRACKING ROUTES
 */

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
