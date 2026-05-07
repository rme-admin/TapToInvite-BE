const prisma = require('../../config/db');
const { getUploadPath } = require('../../middlewares/upload.middleware');
const fs = require('fs');
const path = require('path');

/**
 * GET /api/admin/plans
 * Fetch all product plans (admin view - shows all including inactive)
 */
exports.getAllPlans = async (req, res) => {
    try {
        const plans = await prisma.productPlan.findMany({
            orderBy: {
                created_at: 'desc'
            },
            select: {
                id: true,
                name: true,
                description: true,
                base_price: true,
                is_recommended: true,
                features: true,
                icon_url: true,
                status: true,
                min_nfc_qty: true,
                min_normal_qty: true,
                created_at: true,
                updated_at: true,
                _count: {
                    select: { orders: true }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'Plans fetched successfully',
            data: plans
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plans',
            error: error.message
        });
    }
};

/**
 * GET /api/public/plans
 * Fetch only active product plans (public view)
 */
exports.getActivePlans = async (req, res) => {
    try {
        const plans = await prisma.productPlan.findMany({
            where: {
                status: 'active'
            },
            orderBy: {
                is_recommended: 'desc'
            },
            select: {
                id: true,
                name: true,
                description: true,
                base_price: true,
                is_recommended: true,
                features: true,
                icon_url: true,
                min_nfc_qty: true,
                min_normal_qty: true
            }
        });

        const normalizedPlans = plans.map((plan) => ({
            ...plan,
            price: parseFloat(plan.base_price),
            popular: plan.is_recommended,
        }));

        res.status(200).json({
            success: true,
            message: 'Active plans fetched successfully',
            data: normalizedPlans
        });
    } catch (error) {
        console.error('Error fetching active plans:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching active plans',
            error: error.message
        });
    }
};

/**
 * GET /api/admin/plans/:id
 * Fetch specific plan details (admin view)
 */
exports.getPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required'
            });
        }

        const plan = await prisma.productPlan.findUnique({
            where: { id: parseInt(id) },
            include: {
                orders: {
                    select: {
                        id: true,
                        order_number: true,
                        total_amount: true,
                        created_at: true
                    }
                }
            }
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Plan fetched successfully',
            data: plan
        });
    } catch (error) {
        console.error('Error fetching plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plan',
            error: error.message
        });
    }
};

/**
 * GET /api/public/plans/:id
 * Fetch specific plan details (public view - only active plans)
 */
exports.getPublicPlanById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required'
            });
        }

        const plan = await prisma.productPlan.findFirst({
            where: {
                id: parseInt(id),
                status: 'active'
            },
            select: {
                id: true,
                name: true,
                description: true,
                base_price: true,
                is_recommended: true,
                features: true,
                icon_url: true,
                min_nfc_qty: true,
                min_normal_qty: true,
                created_at: true
            }
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found or is currently inactive'
            });
        }

        const normalizedPlan = {
            ...plan,
            price: parseFloat(plan.base_price),
            popular: plan.is_recommended,
        };

        res.status(200).json({
            success: true,
            message: 'Plan fetched successfully',
            data: normalizedPlan
        });
    } catch (error) {
        console.error('Error fetching public plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching plan',
            error: error.message
        });
    }
};

/**
 * POST /api/admin/plans
 * Create a new product plan
 */
exports.createPlan = async (req, res) => {
    try {
        const { name, description, base_price, is_recommended, features, min_nfc_qty, min_normal_qty, status } = req.body;

        // Validation
        if (!name || !description || !base_price) {
            return res.status(400).json({
                success: false,
                message: 'Plan name, description, and base price are required'
            });
        }

        // Parse features if it's a string
        let parsedFeatures = features;
        if (typeof features === 'string') {
            try {
                parsedFeatures = JSON.parse(features);
            } catch (e) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid features JSON format'
                });
            }
        }

        // Build icon URL if file was uploaded
        let icon_url = null;
        if (req.file) {
            icon_url = getUploadPath(req.file.filename, 'plan_icons');
        }

        const plan = await prisma.productPlan.create({
            data: {
                name: name.trim(),
                description: description.trim(),
                base_price: parseFloat(base_price),
                is_recommended: is_recommended === 'true' || is_recommended === true,
                features: parsedFeatures || [],
                icon_url: icon_url,
                min_nfc_qty: parseInt(min_nfc_qty) || 0,
                min_normal_qty: parseInt(min_normal_qty) || 0,
                status: status || 'active'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Plan created successfully',
            data: plan
        });
    } catch (error) {
        // Clean up uploaded file if database operation fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Error creating plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating plan',
            error: error.message
        });
    }
};

/**
 * PUT /api/admin/plans/:id
 * Update an existing product plan
 */
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, base_price, is_recommended, features, min_nfc_qty, min_normal_qty, status, remove_icon } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required'
            });
        }

        // Check if plan exists
        const existingPlan = await prisma.productPlan.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingPlan) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Parse features if it's a string
        let parsedFeatures = features;
        if (features && typeof features === 'string') {
            try {
                parsedFeatures = JSON.parse(features);
            } catch (e) {
                if (req.file) {
                    fs.unlinkSync(req.file.path);
                }
                return res.status(400).json({
                    success: false,
                    message: 'Invalid features JSON format'
                });
            }
        }

        // Handle icon URL update
        let icon_url = existingPlan.icon_url;
        if (req.file) {
            // Delete old file if exists
            if (existingPlan.icon_url) {
                const oldFilePath = path.join(__dirname, '../../public', existingPlan.icon_url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            icon_url = getUploadPath(req.file.filename, 'plan_icons');
        } else if (remove_icon === 'true' || remove_icon === true) {
            if (existingPlan.icon_url) {
                const oldFilePath = path.join(__dirname, '../../public', existingPlan.icon_url);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }
            icon_url = null;
        }

        const updatedPlan = await prisma.productPlan.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name: name.trim() }),
                ...(description && { description: description.trim() }),
                ...(base_price && { base_price: parseFloat(base_price) }),
                ...(is_recommended !== undefined && { is_recommended: is_recommended === 'true' || is_recommended === true }),
                ...(parsedFeatures && { features: parsedFeatures }),
                ...(icon_url !== undefined && { icon_url }),
                ...(min_nfc_qty !== undefined && { min_nfc_qty: parseInt(min_nfc_qty) }),
                ...(min_normal_qty !== undefined && { min_normal_qty: parseInt(min_normal_qty) }),
                ...(status && { status })
            }
        });

        res.status(200).json({
            success: true,
            message: 'Plan updated successfully',
            data: updatedPlan
        });
    } catch (error) {
        // Clean up uploaded file if database operation fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        console.error('Error updating plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating plan',
            error: error.message
        });
    }
};

/**
 * DELETE /api/admin/plans/:id
 * Delete a product plan
 */
exports.deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required'
            });
        }

        // Check if plan exists
        const existingPlan = await prisma.productPlan.findUnique({
            where: { id: parseInt(id) },
            include: {
                orders: true
            }
        });

        if (!existingPlan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        // Check if plan has associated orders
        if (existingPlan.orders.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete plan with associated orders. Mark as inactive instead.'
            });
        }

        // Delete icon file if exists
        if (existingPlan.icon_url) {
            const filePath = path.join(__dirname, '../../public', existingPlan.icon_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete plan
        await prisma.productPlan.delete({
            where: { id: parseInt(id) }
        });

        res.status(200).json({
            success: true,
            message: 'Plan deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting plan',
            error: error.message
        });
    }
};

/**
 * GET /api/public/plans/:id/pricing
 * Fetch plan details with calculated base price including cheapest templates
 * Calculation: base_price + (min_nfc_qty * cheapest_nfc_price) + (min_normal_qty * cheapest_normal_price)
 */
exports.getPlanWithPricing = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID is required'
            });
        }

        // Fetch the plan
        const plan = await prisma.productPlan.findFirst({
            where: {
                id: parseInt(id),
                status: 'active'
            },
            select: {
                id: true,
                name: true,
                description: true,
                base_price: true,
                is_recommended: true,
                features: true,
                icon_url: true,
                min_nfc_qty: true,
                min_normal_qty: true
            }
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found or is currently inactive'
            });
        }

        // Fetch cheapest active NFC template
        const cheapestNFC = await prisma.nfcTemplate.findFirst({
            where: { status: 'active' },
            orderBy: { price: 'asc' },
            select: { id: true, name: true, price: true }
        });

        // Fetch cheapest active normal template
        const cheapestNormal = await prisma.normalCardTemplate.findFirst({
            where: { status: 'active' },
            orderBy: { price: 'asc' },
            select: { id: true, name: true, price: true }
        });

        // Calculate base price
        const nfcCost = cheapestNFC ? (plan.min_nfc_qty * cheapestNFC.price) : 0;
        const normalCost = cheapestNormal ? (plan.min_normal_qty * cheapestNormal.price) : 0;
        const calculatedBasePrice = parseFloat(plan.base_price) + nfcCost + normalCost;

        res.status(200).json({
            success: true,
            message: 'Plan pricing calculated successfully',
            data: {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                base_price: parseFloat(plan.base_price),
                price: parseFloat(plan.base_price),
                is_recommended: plan.is_recommended,
                popular: plan.is_recommended,
                features: plan.features,
                icon_url: plan.icon_url,
                min_nfc_qty: plan.min_nfc_qty,
                min_normal_qty: plan.min_normal_qty,
                cheapest_nfc_template: cheapestNFC,
                cheapest_normal_template: cheapestNormal,
                calculated_base_price: Math.round(calculatedBasePrice),
                pricing_breakdown: {
                    base_plan_price: parseFloat(plan.base_price),
                    nfc_cost: Math.round(nfcCost),
                    normal_card_cost: Math.round(normalCost),
                    total: Math.round(calculatedBasePrice)
                }
            }
        });
    } catch (error) {
        console.error('Error calculating plan pricing:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating plan pricing',
            error: error.message
        });
    }
};
