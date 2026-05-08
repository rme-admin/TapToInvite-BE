const prisma = require('../../config/db');
const { getUploadPath } = require('../../middlewares/upload.middleware');
const fs = require('fs');
const path = require('path');

const slugify = (text) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');

// ═══════════════════════════════════════════════════════════════════════════════
// POST-PURCHASE CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── LIST ALL CATEGORIES (tree) ──────────────────────────────────────────────
exports.getAllPPCategories = async (req, res) => {
    try {
        const categories = await prisma.postPurchaseCategory.findMany({
            where: { status: { not: 'archived' } },
            include: {
                parent: { select: { id: true, name: true } },
                children: {
                    where: { status: { not: 'archived' } },
                    select: { id: true, name: true, slug: true, status: true }
                },
                _count: { select: { products: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error('Get PP Categories Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
    }
};

// ─── GET SINGLE CATEGORY ─────────────────────────────────────────────────────
exports.getPPCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const cat = await prisma.postPurchaseCategory.findUnique({
            where: { id: parseInt(id) },
            include: {
                parent: { select: { id: true, name: true } },
                children: { where: { status: { not: 'archived' } }, select: { id: true, name: true, slug: true, status: true } },
                _count: { select: { products: true } }
            }
        });
        if (!cat) return res.status(404).json({ success: false, message: 'Category not found.' });
        res.status(200).json({ success: true, data: cat });
    } catch (error) {
        console.error('Get PP Category Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch category', error: error.message });
    }
};

// ─── CREATE CATEGORY ─────────────────────────────────────────────────────────
exports.createPPCategory = async (req, res) => {
    try {
        const { name, slug: customSlug, parent_id, status } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });

        const finalSlug = customSlug ? slugify(customSlug) : slugify(name);
        const existing = await prisma.postPurchaseCategory.findUnique({ where: { slug: finalSlug } });
        if (existing) return res.status(409).json({ success: false, message: `Slug "${finalSlug}" already exists.` });

        let icon_url = null;
        if (req.file) icon_url = getUploadPath(req.file.filename, 'event_categories');

        const cat = await prisma.postPurchaseCategory.create({
            data: {
                name: String(name).trim(),
                slug: finalSlug,
                icon_url,
                parent_id: parent_id ? parseInt(parent_id) : null,
                status: status || 'active',
            }
        });
        res.status(201).json({ success: true, message: 'Category created.', data: cat });
    } catch (error) {
        console.error('Create PP Category Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
    }
};

// ─── UPDATE CATEGORY ─────────────────────────────────────────────────────────
exports.updatePPCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug: customSlug, parent_id, status } = req.body;
        const existing = await prisma.postPurchaseCategory.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ success: false, message: 'Category not found.' });

        const updateData = {};
        if (name !== undefined) updateData.name = String(name).trim();
        if (customSlug !== undefined) {
            const newSlug = slugify(customSlug);
            if (newSlug !== existing.slug) {
                const slugExists = await prisma.postPurchaseCategory.findUnique({ where: { slug: newSlug } });
                if (slugExists) return res.status(409).json({ success: false, message: `Slug "${newSlug}" already exists.` });
            }
            updateData.slug = newSlug;
        }
        if (parent_id !== undefined) updateData.parent_id = parent_id ? parseInt(parent_id) : null;
        if (status !== undefined) updateData.status = status;
        if (req.file) {
            if (existing.icon_url) {
                const old = path.join(__dirname, '../../public', existing.icon_url);
                if (fs.existsSync(old)) fs.unlinkSync(old);
            }
            updateData.icon_url = getUploadPath(req.file.filename, 'event_categories');
        }

        const cat = await prisma.postPurchaseCategory.update({ where: { id: parseInt(id) }, data: updateData });
        res.status(200).json({ success: true, message: 'Category updated.', data: cat });
    } catch (error) {
        console.error('Update PP Category Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
    }
};

// ─── DELETE (archive) CATEGORY ───────────────────────────────────────────────
exports.deletePPCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.postPurchaseCategory.update({ where: { id: parseInt(id) }, data: { status: 'archived' } });
        res.status(200).json({ success: true, message: 'Category archived.' });
    } catch (error) {
        console.error('Delete PP Category Error:', error);
        res.status(500).json({ success: false, message: 'Failed to archive category', error: error.message });
    }
};

// ─── CHANGE STATUS ───────────────────────────────────────────────────────────
exports.updatePPCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'inactive', 'archived'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        await prisma.postPurchaseCategory.update({ where: { id: parseInt(id) }, data: { status } });
        res.status(200).json({ success: true, message: `Category status set to ${status}.` });
    } catch (error) {
        console.error('Update PP Category Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST-PURCHASE PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── LIST ALL PRODUCTS ───────────────────────────────────────────────────────
exports.getAllPPProducts = async (req, res) => {
    try {
        const products = await prisma.postPurchaseProduct.findMany({
            where: { status: { not: 'archived' } },
            include: { category: { select: { id: true, name: true, slug: true } } },
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error('Get PP Products Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
    }
};

// ─── GET SINGLE PRODUCT ─────────────────────────────────────────────────────
exports.getPPProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.postPurchaseProduct.findUnique({
            where: { id: parseInt(id) },
            include: { category: { select: { id: true, name: true, slug: true } } }
        });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error('Get PP Product Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
    }
};

// ─── CREATE PRODUCT ──────────────────────────────────────────────────────────
exports.createPPProduct = async (req, res) => {
    try {
        const { name, description, price, discount_percent, stock_quantity, status, is_recommended, category_id } = req.body;
        if (!name || !price) return res.status(400).json({ success: false, message: 'Name and price are required.' });

        let images = [];
        if (req.files && req.files.length > 0) {
            images = req.files.map(f => getUploadPath(f.filename, 'post_purchase'));
        }

        const product = await prisma.postPurchaseProduct.create({
            data: {
                name: String(name).trim(),
                description: description || null,
                images,
                price: parseFloat(price),
                discount_percent: discount_percent ? parseFloat(discount_percent) : null,
                stock_quantity: stock_quantity ? parseInt(stock_quantity) : null,
                status: status || 'active',
                is_recommended: is_recommended === 'true' || is_recommended === true,
                category_id: category_id ? parseInt(category_id) : null,
            },
            include: { category: { select: { id: true, name: true } } }
        });

        res.status(201).json({ success: true, message: 'Product created.', data: product });
    } catch (error) {
        console.error('Create PP Product Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
    }
};

// ─── UPDATE PRODUCT ──────────────────────────────────────────────────────────
exports.updatePPProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, discount_percent, stock_quantity, status, is_recommended, category_id } = req.body;

        const existing = await prisma.postPurchaseProduct.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ success: false, message: 'Product not found.' });

        const updateData = {};
        if (name !== undefined) updateData.name = String(name).trim();
        if (description !== undefined) updateData.description = description || null;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (discount_percent !== undefined) updateData.discount_percent = discount_percent ? parseFloat(discount_percent) : null;
        if (stock_quantity !== undefined) updateData.stock_quantity = stock_quantity ? parseInt(stock_quantity) : null;
        if (status !== undefined) updateData.status = status;
        if (is_recommended !== undefined) updateData.is_recommended = is_recommended === 'true' || is_recommended === true;
        if (category_id !== undefined) updateData.category_id = category_id ? parseInt(category_id) : null;

        // New images
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(f => getUploadPath(f.filename, 'post_purchase'));
            const existingImages = Array.isArray(existing.images) ? existing.images : [];
            updateData.images = [...existingImages, ...newImages];
        }

        const product = await prisma.postPurchaseProduct.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { category: { select: { id: true, name: true } } }
        });

        res.status(200).json({ success: true, message: 'Product updated.', data: product });
    } catch (error) {
        console.error('Update PP Product Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
    }
};

// ─── DELETE (archive) PRODUCT ────────────────────────────────────────────────
exports.deletePPProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.postPurchaseProduct.update({ where: { id: parseInt(id) }, data: { status: 'archived' } });
        res.status(200).json({ success: true, message: 'Product archived.' });
    } catch (error) {
        console.error('Delete PP Product Error:', error);
        res.status(500).json({ success: false, message: 'Failed to archive product', error: error.message });
    }
};

// ─── CHANGE STATUS ───────────────────────────────────────────────────────────
exports.updatePPProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'inactive', 'archived'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        await prisma.postPurchaseProduct.update({ where: { id: parseInt(id) }, data: { status } });
        res.status(200).json({ success: true, message: `Status set to ${status}.` });
    } catch (error) {
        console.error('Update PP Product Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// ─── TOGGLE RECOMMENDATION ──────────────────────────────────────────────────
exports.updatePPProductRecommendation = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_recommended } = req.body;
        await prisma.postPurchaseProduct.update({ where: { id: parseInt(id) }, data: { is_recommended: Boolean(is_recommended) } });
        res.status(200).json({ success: true, message: `Recommendation updated.` });
    } catch (error) {
        console.error('Update PP Product Recommendation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update recommendation', error: error.message });
    }
};
