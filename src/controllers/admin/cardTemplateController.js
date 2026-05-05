const prisma = require('../../config/db');

const deriveGroup = () => 'CARD';

// ─── LIST ALL TEMPLATES ───────────────────────────────────────────────────────
exports.getAllCardTemplates = async (req, res) => {
    try {
        const templates = await prisma.normalCardTemplate.findMany({
            where: { status: { not: 'archived' } },
            include: {
                categories: {
                    include: { event_category: { select: { id: true, name: true, slug: true } } }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const normalized = templates.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            width_mm: t.width_mm,
            height_mm: t.height_mm,
            images: t.images,
            price: t.price,
            status: t.status,
            is_recommended: t.is_recommended,
            created_at: t.created_at,
            updated_at: t.updated_at,
            categories: t.categories.map(c => c.event_category)
        }));

        res.status(200).json({ success: true, data: normalized });
    } catch (error) {
        console.error('Get Card Templates Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch card templates', error: error.message });
    }
};

// ─── GET SINGLE ──────────────────────────────────────────────────────────────
exports.getCardTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await prisma.normalCardTemplate.findUnique({
            where: { id: parseInt(id) },
            include: {
                categories: {
                    include: { event_category: { select: { id: true, name: true, slug: true } } }
                }
            }
        });

        if (!template) return res.status(404).json({ success: false, message: 'Template not found.' });

        res.status(200).json({
            success: true,
            data: { ...template, categories: template.categories.map(c => c.event_category) }
        });
    } catch (error) {
        console.error('Get Card Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch template', error: error.message });
    }
};

// ─── CREATE ──────────────────────────────────────────────────────────────────
exports.createCardTemplate = async (req, res) => {
    try {
        const { name, description, width_mm, height_mm, price, status, is_recommended, categoryIds } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, message: 'Name and price are required.' });
        }

        const images = req.files?.map(f => `/uploads/card_templates/${f.filename}`) || [];

        const parsedCategoryIds = categoryIds
            ? (Array.isArray(categoryIds) ? categoryIds : JSON.parse(categoryIds)).map(Number)
            : [];

        const template = await prisma.normalCardTemplate.create({
            data: {
                name: String(name).trim(),
                description: description ? String(description).trim() : null,
                width_mm: width_mm ? parseFloat(width_mm) : null,
                height_mm: height_mm ? parseFloat(height_mm) : null,
                images,
                price: parseFloat(price),
                status: status || 'active',
                is_recommended: is_recommended === 'true' || is_recommended === true,
                categories: {
                    create: parsedCategoryIds.map(catId => ({ event_category_id: catId }))
                }
            },
            include: {
                categories: {
                    include: { event_category: { select: { id: true, name: true, slug: true } } }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Card template created.',
            data: { ...template, categories: template.categories.map(c => c.event_category) }
        });
    } catch (error) {
        console.error('Create Card Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create template', error: error.message });
    }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
exports.updateCardTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, width_mm, height_mm, price, status, is_recommended, categoryIds } = req.body;

        const existing = await prisma.normalCardTemplate.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ success: false, message: 'Template not found.' });

        const updateData = {};
        if (name !== undefined) updateData.name = String(name).trim();
        if (description !== undefined) updateData.description = String(description).trim() || null;
        if (width_mm !== undefined) updateData.width_mm = parseFloat(width_mm);
        if (height_mm !== undefined) updateData.height_mm = parseFloat(height_mm);
        if (price !== undefined) updateData.price = parseFloat(price);
        if (status !== undefined) updateData.status = status;
        if (is_recommended !== undefined) updateData.is_recommended = is_recommended === 'true' || is_recommended === true;

        if (req.files?.length > 0) {
            const newImages = req.files.map(f => `/uploads/card_templates/${f.filename}`);
            const existingImages = Array.isArray(existing.images) ? existing.images : [];
            updateData.images = [...existingImages, ...newImages];
        }

        if (categoryIds !== undefined) {
            const parsedCategoryIds = (Array.isArray(categoryIds) ? categoryIds : JSON.parse(categoryIds)).map(Number);
            await prisma.normalTemplateCategory.deleteMany({ where: { normal_template_id: parseInt(id) } });
            updateData.categories = { create: parsedCategoryIds.map(catId => ({ event_category_id: catId })) };
        }

        const template = await prisma.normalCardTemplate.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                categories: {
                    include: { event_category: { select: { id: true, name: true, slug: true } } }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'Card template updated.',
            data: { ...template, categories: template.categories.map(c => c.event_category) }
        });
    } catch (error) {
        console.error('Update Card Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update template', error: error.message });
    }
};

// ─── SOFT DELETE ─────────────────────────────────────────────────────────────
exports.deleteCardTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.normalCardTemplate.update({ where: { id: parseInt(id) }, data: { status: 'archived' } });
        res.status(200).json({ success: true, message: 'Card template archived.' });
    } catch (error) {
        console.error('Delete Card Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to archive template', error: error.message });
    }
};

// ─── STATUS ──────────────────────────────────────────────────────────────────
exports.updateCardTemplateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'inactive', 'archived'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }
        await prisma.normalCardTemplate.update({ where: { id: parseInt(id) }, data: { status } });
        res.status(200).json({ success: true, message: `Status set to ${status}.` });
    } catch (error) {
        console.error('Update Card Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// ─── RECOMMENDATION ──────────────────────────────────────────────────────────
exports.updateCardTemplateRecommendation = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_recommended } = req.body;
        await prisma.normalCardTemplate.update({ where: { id: parseInt(id) }, data: { is_recommended: Boolean(is_recommended) } });
        res.status(200).json({ success: true, message: 'Recommendation updated.' });
    } catch (error) {
        console.error('Update Card Recommendation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update recommendation', error: error.message });
    }
};
