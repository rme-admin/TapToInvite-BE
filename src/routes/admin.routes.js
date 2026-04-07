const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRole } = require('../middlewares/auth.middleware');
const contentController = require('../controllers/admin/contentController');

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

module.exports = router;
