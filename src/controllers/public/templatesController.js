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
                    status: 'active',
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
                where: { status: 'active' },
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
                    status: 'active',
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
                where: { status: 'active' },
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
            where: { status: 'active' }
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
        const { category_id, sort_by } = req.query;
        const where = { status: 'active' };
        
        if (category_id && !isNaN(parseInt(category_id))) {
            const catId = parseInt(category_id);
            
            // Check if this category has children
            const category = await prisma.postPurchaseCategory.findUnique({
                where: { id: catId },
                include: { children: { select: { id: true } } }
            });

            if (category && category.children.length > 0) {
                // Include parent and all children
                const allIds = [catId, ...category.children.map(c => c.id)];
                where.category_id = { in: allIds };
            } else {
                where.category_id = catId;
            }
        }

        // Sorting logic
        let orderBy = { created_at: 'desc' };
        if (sort_by === 'price-low') orderBy = { price: 'asc' };
        else if (sort_by === 'price-high') orderBy = { price: 'desc' };
        else if (sort_by === 'discount') orderBy = { discount_percent: 'desc' };
        else if (sort_by === 'recommended') orderBy = { is_recommended: 'desc' };

        const products = await prisma.postPurchaseProduct.findMany({
            where,
            include: { category: { select: { id: true, name: true, slug: true } } },
            orderBy
        });
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error('Get Products Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch products' });
    }
};

// --- GET ALL ACTIVE PRODUCT CATEGORIES ---
exports.getActiveProductCategories = async (req, res) => {
    try {
        const categories = await prisma.postPurchaseCategory.findMany({
            where: { status: 'active', parent_id: null },
            include: {
                children: {
                    where: { status: 'active' },
                    select: { id: true, name: true, slug: true }
                },
                _count: { select: { products: true } }
            },
            orderBy: { name: 'asc' }
        });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error('Get Product Categories Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

// --- GET POST-PURCHASE PRODUCT BY ID ---
exports.getPostPurchaseProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.postPurchaseProduct.findFirst({
            where: { id: parseInt(id), status: 'active' },
            include: { category: { select: { id: true, name: true, slug: true } } }
        });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error('Get Product Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch product' });
    }
};
