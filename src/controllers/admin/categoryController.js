const prisma = require('../../config/db');
const { getUploadPath } = require('../../middlewares/upload.middleware');
const fs = require('fs');
const path = require('path');

/**
 * Helper: generate slug from name
 */
const slugify = (text) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');

// ─── LIST ALL CATEGORIES ──────────────────────────────────────────────────────
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.eventCategory.findMany({
            where: { status: { not: 'archived' } },
            orderBy: { created_at: 'desc' },
            include: {
                _count: {
                    select: {
                        nfc_templates: true,
                        normal_templates: true,
                        orders: true
                    }
                }
            }
        });

        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error('Get Categories Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
    }
};

// ─── GET SINGLE CATEGORY ─────────────────────────────────────────────────────
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.eventCategory.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: { nfc_templates: true, normal_templates: true, orders: true }
                }
            }
        });

        if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        console.error('Get Category Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch category', error: error.message });
    }
};

// ─── CREATE CATEGORY ─────────────────────────────────────────────────────────
exports.createCategory = async (req, res) => {
    try {
        const { name, slug: customSlug, status } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required.' });
        }

        const finalSlug = customSlug ? slugify(customSlug) : slugify(name);

        // Check for slug uniqueness
        const existing = await prisma.eventCategory.findUnique({ where: { slug: finalSlug } });
        if (existing) {
            return res.status(409).json({ success: false, message: `Slug "${finalSlug}" already exists.` });
        }

        let icon_url = null;
        if (req.file) {
            icon_url = getUploadPath(req.file.filename, 'event_categories');
        }

        const category = await prisma.eventCategory.create({
            data: {
                name: String(name).trim(),
                slug: finalSlug,
                icon_url,
                status: status || 'active',
            }
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully.',
            data: category
        });
    } catch (error) {
        console.error('Create Category Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create category', error: error.message });
    }
};

// ─── UPDATE CATEGORY ─────────────────────────────────────────────────────────
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug: customSlug, status } = req.body;

        const existing = await prisma.eventCategory.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ success: false, message: 'Category not found.' });

        const updateData = {};
        if (name !== undefined) updateData.name = String(name).trim();
        if (customSlug !== undefined) {
            const newSlug = slugify(customSlug);
            // Check uniqueness if slug changed
            if (newSlug !== existing.slug) {
                const slugExists = await prisma.eventCategory.findUnique({ where: { slug: newSlug } });
                if (slugExists) {
                    return res.status(409).json({ success: false, message: `Slug "${newSlug}" already exists.` });
                }
            }
            updateData.slug = newSlug;
        }
        if (status !== undefined) updateData.status = status;

        // Handle icon upload
        if (req.file) {
            // Delete old icon
            if (existing.icon_url) {
                const oldPath = path.join(__dirname, '../../public', existing.icon_url);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.icon_url = getUploadPath(req.file.filename, 'event_categories');
        }

        const category = await prisma.eventCategory.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: 'Category updated successfully.',
            data: category
        });
    } catch (error) {
        console.error('Update Category Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
    }
};

// ─── SOFT DELETE (archive) ───────────────────────────────────────────────────
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.eventCategory.update({
            where: { id: parseInt(id) },
            data: { status: 'archived' }
        });
        res.status(200).json({ success: true, message: 'Category archived successfully.' });
    } catch (error) {
        console.error('Delete Category Error:', error);
        res.status(500).json({ success: false, message: 'Failed to archive category', error: error.message });
    }
};

// ─── CHANGE STATUS ───────────────────────────────────────────────────────────
exports.updateCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'archived'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        await prisma.eventCategory.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        res.status(200).json({ success: true, message: `Category status set to ${status}.` });
    } catch (error) {
        console.error('Update Category Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};
