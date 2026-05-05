const prisma = require('../../config/db');
const path = require('path');
const fs = require('fs');

// ─── LIST ALL TEMPLATES ───────────────────────────────────────────────────────
exports.getAllNfcTemplates = async (req, res) => {
    try {
        const templates = await prisma.nfcTemplate.findMany({
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
        console.error('Get NFC Templates Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch templates', error: error.message });
    }
};

// ─── GET SINGLE TEMPLATE ─────────────────────────────────────────────────────
exports.getNfcTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await prisma.nfcTemplate.findUnique({
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
            data: {
                ...template,
                categories: template.categories.map(c => c.event_category)
            }
        });
    } catch (error) {
        console.error('Get NFC Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch template', error: error.message });
    }
};

// ─── CREATE TEMPLATE ─────────────────────────────────────────────────────────
exports.createNfcTemplate = async (req, res) => {
    try {
        const { name, description, width_mm, height_mm, price, status, is_recommended, categoryIds } = req.body;

        if (!name || !price) {
            return res.status(400).json({ success: false, message: 'Name and price are required.' });
        }

        // Build image paths from uploaded files
        const images = req.files?.map(file =>
            `/uploads/nfc_templates/${file.filename}`
        ) || [];

        const parsedCategoryIds = categoryIds
            ? (Array.isArray(categoryIds) ? categoryIds : JSON.parse(categoryIds)).map(Number)
            : [];

        const template = await prisma.nfcTemplate.create({
            data: {
                name: String(name).trim(),
                description: description ? String(description).trim() : null,
                width_mm: width_mm ? parseFloat(width_mm) : null,
                height_mm: height_mm ? parseFloat(height_mm) : null,
                images: images,
                price: parseFloat(price),
                status: status || 'active',
                is_recommended: is_recommended === 'true' || is_recommended === true,
                categories: {
                    create: parsedCategoryIds.map(catId => ({
                        event_category_id: catId
                    }))
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
            message: 'Template created successfully.',
            data: { ...template, categories: template.categories.map(c => c.event_category) }
        });
    } catch (error) {
        console.error('Create NFC Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create template', error: error.message });
    }
};

// ─── UPDATE TEMPLATE ─────────────────────────────────────────────────────────
exports.updateNfcTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, width_mm, height_mm, price, status, is_recommended, categoryIds } = req.body;

        const existing = await prisma.nfcTemplate.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ success: false, message: 'Template not found.' });

        const updateData = {};
        if (name !== undefined) updateData.name = String(name).trim();
        if (description !== undefined) updateData.description = String(description).trim() || null;
        if (width_mm !== undefined) updateData.width_mm = parseFloat(width_mm);
        if (height_mm !== undefined) updateData.height_mm = parseFloat(height_mm);
        if (price !== undefined) updateData.price = parseFloat(price);
        if (status !== undefined) updateData.status = status;
        if (is_recommended !== undefined) updateData.is_recommended = is_recommended === 'true' || is_recommended === true;

        // Handle new uploaded images
        if (req.files?.length > 0) {
            const newImages = req.files.map(file => `/uploads/nfc_templates/${file.filename}`);
            const existingImages = Array.isArray(existing.images) ? existing.images : [];
            updateData.images = [...existingImages, ...newImages];
        }

        // Handle category changes
        if (categoryIds !== undefined) {
            const parsedCategoryIds = (Array.isArray(categoryIds) ? categoryIds : JSON.parse(categoryIds)).map(Number);
            // Delete old, create new
            await prisma.nfcTemplateCategory.deleteMany({ where: { nfc_template_id: parseInt(id) } });
            updateData.categories = {
                create: parsedCategoryIds.map(catId => ({ event_category_id: catId }))
            };
        }

        const template = await prisma.nfcTemplate.update({
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
            message: 'Template updated successfully.',
            data: { ...template, categories: template.categories.map(c => c.event_category) }
        });
    } catch (error) {
        console.error('Update NFC Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update template', error: error.message });
    }
};

// ─── SOFT DELETE (archive) ───────────────────────────────────────────────────
exports.deleteNfcTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.nfcTemplate.update({
            where: { id: parseInt(id) },
            data: { status: 'archived' }
        });
        res.status(200).json({ success: true, message: 'Template archived successfully.' });
    } catch (error) {
        console.error('Delete NFC Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to archive template', error: error.message });
    }
};

// ─── CHANGE STATUS ───────────────────────────────────────────────────────────
exports.updateNfcTemplateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'archived'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        await prisma.nfcTemplate.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        res.status(200).json({ success: true, message: `Template status set to ${status}.` });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// ─── TOGGLE RECOMMENDATION ───────────────────────────────────────────────────
exports.updateNfcTemplateRecommendation = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_recommended } = req.body;

        await prisma.nfcTemplate.update({
            where: { id: parseInt(id) },
            data: { is_recommended: Boolean(is_recommended) }
        });

        res.status(200).json({ success: true, message: `Template recommendation updated.` });
    } catch (error) {
        console.error('Update Recommendation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update recommendation', error: error.message });
    }
};
