const prisma = require('../../config/db');

// --- GET ALL ACTIVE NFC TEMPLATES (with optional category filter) ---
exports.getActiveNFCTemplates = async (req, res) => {
    try {
        const { categoryId } = req.query;
        
        let templates;
        
        if (categoryId) {
            // Fetch NFC templates for a specific category
            templates = await prisma.nfcTemplate.findMany({
                where: { 
                    is_active: true,
                    categories: {
                        some: {
                            event_category_id: parseInt(categoryId)
                        }
                    }
                },
                include: {
                    categories: true
                }
            });
        } else {
            // Fetch all active NFC templates
            templates = await prisma.nfcTemplate.findMany({
                where: { is_active: true },
                include: {
                    categories: true
                }
            });
        }

        res.status(200).json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error("Get NFC Templates Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch NFC templates"
        });
    }
};

// --- GET NFC TEMPLATE BY ID ---
exports.getNFCTemplateById = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await prisma.nfcTemplate.findUnique({
            where: { id: parseInt(id) }
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "NFC Template not found"
            });
        }

        res.status(200).json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error("Get NFC Template Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch NFC template"
        });
    }
};

// --- GET ALL ACTIVE NORMAL CARD TEMPLATES (with optional category filter) ---
exports.getActiveNormalTemplates = async (req, res) => {
    try {
        const { categoryId } = req.query;
        
        let templates;
        
        if (categoryId) {
            // Fetch normal templates for a specific category
            templates = await prisma.normalCardTemplate.findMany({
                where: { 
                    is_active: true,
                    categories: {
                        some: {
                            event_category_id: parseInt(categoryId)
                        }
                    }
                },
                include: {
                    categories: true
                }
            });
        } else {
            // Fetch all active normal templates
            templates = await prisma.normalCardTemplate.findMany({
                where: { is_active: true },
                include: {
                    categories: true
                }
            });
        }

        res.status(200).json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error("Get Normal Templates Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch normal card templates"
        });
    }
};

// --- GET NORMAL CARD TEMPLATE BY ID ---
exports.getNormalTemplateById = async (req, res) => {
    try {
        const { id } = req.params;

        const template = await prisma.normalCardTemplate.findUnique({
            where: { id: parseInt(id) }
        });

        if (!template) {
            return res.status(404).json({
                success: false,
                message: "Normal card template not found"
            });
        }

        res.status(200).json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error("Get Normal Template Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch normal card template"
        });
    }
};

// --- GET ALL ACTIVE EVENT CATEGORIES ---
exports.getActiveEventCategories = async (req, res) => {
    try {
        const categories = await prisma.eventCategory.findMany({
            where: { is_active: true }
        });

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error("Get Event Categories Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch event categories"
        });
    }
};

// --- GET EVENT CATEGORY BY ID ---
exports.getEventCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await prisma.eventCategory.findUnique({
            where: { id: parseInt(id) }
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Event category not found"
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error("Get Event Category Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch event category"
        });
    }
};

// --- GET ALL ACTIVE POST-PURCHASE PRODUCTS ---
exports.getActivePostPurchaseProducts = async (req, res) => {
    try {
        const products = await prisma.postPurchaseProduct.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'desc' }
        });

        res.status(200).json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error("Get Post-Purchase Products Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch post-purchase products"
        });
    }
};

// --- GET POST-PURCHASE PRODUCT BY ID ---
exports.getPostPurchaseProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await prisma.postPurchaseProduct.findUnique({
            where: { id: parseInt(id) }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Post-purchase product not found"
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error("Get Post-Purchase Product Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch post-purchase product"
        });
    }
};
