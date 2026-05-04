const prisma = require('../../config/db');
const crypto = require('crypto');

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${timestamp}-${random}`;
};

// --- PLACE ORDER ---
exports.placeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            planId,
            eventCategoryId,
            eventTitle,
            eventDate,
            nfcTemplateId,
            nfcQuantity,
            normalTemplates, // [{templateId, quantity}, ...]
            hasQR,
            webAccess,
            reminders,
            digitalNotes,
            clientInfo // {name, phone, altPhone, email, address1, address2, city, state, pincode, country}
        } = req.body;

        // Validation
        if (!planId || !eventCategoryId || !eventTitle || !clientInfo) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Get plan details
        const plan = await prisma.productPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }

        // Get NFC template if applicable
        let nfcTemplate = null;
        if (nfcQuantity > 0 && nfcTemplateId) {
            nfcTemplate = await prisma.nfcTemplate.findUnique({
                where: { id: nfcTemplateId }
            });
        }

        // Get normal card templates if applicable
        const physicalTemplates = normalTemplates && normalTemplates.length > 0
            ? await prisma.normalCardTemplate.findMany({
                where: { id: { in: normalTemplates.map(t => t.templateId) } }
            })
            : [];

        // Calculate pricing
        let subtotal = parseFloat(plan.base_price) || 0;

        // Add NFC cost
        if (nfcQuantity > 0 && nfcTemplate) {
            subtotal += (nfcQuantity * parseFloat(nfcTemplate.price));
        }

        // Add physical card costs
        if (normalTemplates && normalTemplates.length > 0) {
            normalTemplates.forEach(template => {
                const physicalTemplate = physicalTemplates.find(t => t.id === template.templateId);
                if (physicalTemplate) {
                    subtotal += (template.quantity * parseFloat(physicalTemplate.price));
                }
            });
        }

        const gst = Math.round(subtotal * 0.18); // 18% GST
        const delivery = subtotal > 0 ? 150 : 0; // Flat delivery fee
        const totalAmount = subtotal + gst + delivery;
        const advancePaid = Math.round(totalAmount * 0.3); // 30% advance

        // Create order with items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // 1. Create Order
            const newOrder = await tx.order.create({
                data: {
                    order_number: generateOrderNumber(),
                    user_id: userId,
                    plan_id: planId,
                    event_category_id: eventCategoryId,
                    event_title: eventTitle,
                    event_date: eventDate ? new Date(eventDate) : null,
                    digital_notes: digitalNotes,
                    total_amount: totalAmount,
                    advance_paid: advancePaid,
                    balance_amount: (totalAmount - advancePaid),
                    payment_status: 'Pending',
                    order_status: 'Pending'
                }
            });

            // 2. Create OrderItems array
            const orderItems = [];

            // Add plan item
            orderItems.push({
                order_id: newOrder.id,
                item_type: 'PLAN_BASE',
                reference_id: planId,
                item_name: plan.name,
                quantity: 1,
                unit_price: parseFloat(plan.base_price),
                total_price: parseFloat(plan.base_price)
            });

            // Add NFC items
            if (nfcQuantity > 0 && nfcTemplate) {
                orderItems.push({
                    order_id: newOrder.id,
                    item_type: 'NFC',
                    reference_id: nfcTemplateId,
                    item_name: nfcTemplate.name,
                    quantity: nfcQuantity,
                    unit_price: parseFloat(nfcTemplate.price),
                    total_price: (nfcQuantity * parseFloat(nfcTemplate.price))
                });
            }

            // Add physical card items
            if (normalTemplates && normalTemplates.length > 0) {
                normalTemplates.forEach(template => {
                    const physicalTemplate = physicalTemplates.find(t => t.id === template.templateId);
                    if (physicalTemplate) {
                        orderItems.push({
                            order_id: newOrder.id,
                            item_type: 'NORMAL_CARD',
                            reference_id: template.templateId,
                            item_name: physicalTemplate.name,
                            quantity: template.quantity,
                            unit_price: parseFloat(physicalTemplate.price),
                            total_price: (template.quantity * parseFloat(physicalTemplate.price))
                        });
                    }
                });
            }

            // Add web access if applicable
            if (webAccess && webAccess !== 'none') {
                orderItems.push({
                    order_id: newOrder.id,
                    item_type: webAccess === 'custom' ? 'WEBSITE_CUSTOM' : 'WEBSITE_BASIC',
                    reference_id: null,
                    item_name: webAccess === 'custom' ? 'Custom Website' : 'Basic Website',
                    quantity: 1,
                    unit_price: 0,
                    total_price: 0
                });
            }

            // Add QR code if applicable
            if (hasQR) {
                orderItems.push({
                    order_id: newOrder.id,
                    item_type: 'QR_CODE',
                    reference_id: null,
                    item_name: 'QR Code',
                    quantity: 1,
                    unit_price: 0,
                    total_price: 0
                });
            }

            // Create all items
            await tx.orderItem.createMany({
                data: orderItems
            });

            // 3. Update or create user details
            const userDetails = await tx.userDetails.findUnique({
                where: { user_id: userId }
            }).catch(() => null);

            if (userDetails) {
                await tx.userDetails.update({
                    where: { user_id: userId },
                    data: {
                        alt_phone: clientInfo.altPhone || userDetails.alt_phone,
                        address_line_1: clientInfo.address1 || userDetails.address_line_1,
                        address_line_2: clientInfo.address2 || userDetails.address_line_2,
                        city: clientInfo.city || userDetails.city,
                        state: clientInfo.state || userDetails.state,
                        pincode: clientInfo.pincode || userDetails.pincode,
                        country: clientInfo.country || userDetails.country
                    }
                });
            } else {
                await tx.userDetails.create({
                    data: {
                        user_id: userId,
                        alt_phone: clientInfo.altPhone,
                        address_line_1: clientInfo.address1,
                        address_line_2: clientInfo.address2,
                        city: clientInfo.city,
                        state: clientInfo.state,
                        pincode: clientInfo.pincode,
                        country: clientInfo.country
                    }
                });
            }

            return newOrder;
        });

        // Fetch the complete order with items
        const completeOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: {
                items: true,
                plan: { select: { name: true } }
            }
        });

        res.status(201).json({
            success: true,
            message: "Order placed successfully. Redirect to payment gateway.",
            data: {
                orderId: completeOrder.id,
                orderNumber: completeOrder.order_number,
                totalAmount: completeOrder.total_amount,
                advanceAmount: completeOrder.advance_paid,
                balanceAmount: completeOrder.balance_amount,
                items: completeOrder.items,
                eventTitle: completeOrder.event_title
            }
        });
    } catch (error) {
        console.error("Place Order Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to place order",
            error: error.message
        });
    }
};

// --- GET ORDER DETAILS ---
exports.getOrderDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await prisma.order.findFirst({
            where: {
                id: parseInt(orderId),
                user_id: userId
            },
            include: {
                items: true,
                plan: { select: { name: true } },
                category: { select: { name: true } },
                nfc_issuances: {
                    orderBy: { created_at: 'desc' }
                },
                tracking_notes: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error("Get Order Details Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch order details"
        });
    }
};

// --- GET ALL PLANS ---
exports.getPlans = async (req, res) => {
    try {
        const plans = await prisma.productPlan.findMany({
            where: { status: 'active' }
        });

        res.status(200).json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error("Get Plans Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch plans"
        });
    }
};

// --- GET NFC TEMPLATES ---
exports.getNFCTemplates = async (req, res) => {
    try {
        const templates = await prisma.nfcTemplate.findMany({
            where: { is_active: true }
        });

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

// --- GET NORMAL CARD TEMPLATES ---
exports.getNormalTemplates = async (req, res) => {
    try {
        const templates = await prisma.normalCardTemplate.findMany({
            where: { is_active: true }
        });

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

// --- GET EVENT CATEGORIES ---
exports.getEventCategories = async (req, res) => {
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
