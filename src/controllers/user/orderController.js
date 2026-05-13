const prisma = require('../../config/db');
const crypto = require('crypto');
const sendEmail = require('../../utils/sendEmail');
const { getConfig } = require('../../utils/configHelper');
const Razorpay = require('razorpay');

const trySendEmail = async (payload) => {
    try {
        await sendEmail(payload);
        return { sent: true };
    } catch (error) {
        console.error('Email delivery failed:', error.message);
        return { sent: false, error };
    }
};

// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${timestamp}-${random}`;
};

const buildOrderPricing = async ({ planId, nfcQuantity, nfcTemplateId, normalTemplates }) => {
    const plan = await prisma.productPlan.findUnique({
        where: { id: planId }
    });

    if (!plan) {
        return { plan: null };
    }

    let nfcTemplate = null;
    if (nfcQuantity > 0 && nfcTemplateId) {
        nfcTemplate = await prisma.nfcTemplate.findUnique({
            where: { id: nfcTemplateId }
        });
    }

    const physicalTemplates = normalTemplates && normalTemplates.length > 0
        ? await prisma.normalCardTemplate.findMany({
            where: { id: { in: normalTemplates.map(t => t.templateId) } }
        })
        : [];

    let subtotal = parseFloat(plan.base_price) || 0;

    if (nfcQuantity > 0 && nfcTemplate) {
        subtotal += (nfcQuantity * parseFloat(nfcTemplate.price));
    }

    if (normalTemplates && normalTemplates.length > 0) {
        normalTemplates.forEach(template => {
            const physicalTemplate = physicalTemplates.find(t => t.id === template.templateId);
            if (physicalTemplate) {
                subtotal += (template.quantity * parseFloat(physicalTemplate.price));
            }
        });
    }

    const gst = Math.round(subtotal * 0.18);
    const delivery = subtotal > 0 ? 150 : 0;
    const totalAmount = subtotal + gst + delivery;
    const advancePaid = Math.round(totalAmount * 0.3);

    return {
        plan,
        nfcTemplate,
        physicalTemplates,
        pricing: {
            subtotal,
            gst,
            delivery,
            totalAmount,
            advancePaid,
        }
    };
};

const verifyRazorpaySignature = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    const razorpayKeySecret = await getConfig('razorpay_key_secret');

    if (!razorpayKeySecret) {
        return { valid: false, message: 'Razorpay secret is not configured' };
    }

    const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

    return {
        valid: expectedSignature === razorpaySignature,
        expectedSignature
    };
};

const createRazorpayCheckoutOrder = async ({ amount, orderNumber, userId, planId, email }) => {
    const razorpayKeyId = await getConfig('razorpay_key_id');
    const razorpayKeySecret = await getConfig('razorpay_key_secret');

    if (!razorpayKeyId || !razorpayKeySecret) {
        return { created: false, message: 'Razorpay credentials not configured' };
    }

    const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
    });

    const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: orderNumber,
        notes: {
            user_id: userId ? String(userId) : '',
            plan_id: planId ? String(planId) : '',
            email: email || '',
            order_number: orderNumber
        }
    });

    return {
        created: true,
        razorpayKeyId,
        razorpayOrder
    };
};

const buildCheckoutPayload = async (payload, userId = null) => {
    const { plan, nfcTemplate, physicalTemplates, pricing } = await buildOrderPricing(payload);

    if (!plan) {
        return { plan: null };
    }

    const email = payload?.clientInfo?.email || null;

    if (!userId && email) {
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return {
                plan,
                accountExists: true,
                email,
                pricing
            };
        }
    }

    const orderNumber = generateOrderNumber();
    const payment = await createRazorpayCheckoutOrder({
        amount: pricing.advancePaid,
        orderNumber,
        userId,
        planId: payload.planId,
        email
    });

    return {
        plan,
        nfcTemplate,
        physicalTemplates,
        pricing,
        orderNumber,
        payment
    };
};

const upsertCustomerDetails = async (tx, userId, clientInfo) => {
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
        return;
    }

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
};

const createOrderForUser = async (tx, userId, payload) => {
    const { plan, nfcTemplate, physicalTemplates, pricing } = await buildOrderPricing(payload);

    if (!plan) {
        return { plan: null };
    }

    const newOrder = await tx.order.create({
        data: {
            order_number: generateOrderNumber(),
            user_id: userId,
            plan_id: payload.planId,
            event_category_id: payload.eventCategoryId,
            event_title: payload.eventTitle,
            event_date: payload.eventDate ? new Date(payload.eventDate) : null,
            digital_notes: payload.digitalNotes,
            total_amount: pricing.totalAmount,
            advance_paid: pricing.advancePaid,
            balance_amount: (pricing.totalAmount - pricing.advancePaid),
            payment_status: 'Pending',
            order_status: 'Pending'
        }
    });

    const orderItems = [];

    orderItems.push({
        order_id: newOrder.id,
        item_type: 'PLAN_BASE',
        reference_id: payload.planId,
        item_name: plan.name,
        quantity: 1,
        unit_price: parseFloat(plan.base_price),
        total_price: parseFloat(plan.base_price)
    });

    if (payload.nfcQuantity > 0 && nfcTemplate) {
        orderItems.push({
            order_id: newOrder.id,
            item_type: 'NFC',
            reference_id: payload.nfcTemplateId,
            item_name: nfcTemplate.name,
            quantity: payload.nfcQuantity,
            unit_price: parseFloat(nfcTemplate.price),
            total_price: (payload.nfcQuantity * parseFloat(nfcTemplate.price))
        });
    }

    if (payload.normalTemplates && payload.normalTemplates.length > 0) {
        payload.normalTemplates.forEach(template => {
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

    if (payload.webAccess && payload.webAccess !== 'none') {
        orderItems.push({
            order_id: newOrder.id,
            item_type: payload.webAccess === 'custom' ? 'WEBSITE_CUSTOM' : 'WEBSITE_BASIC',
            reference_id: null,
            item_name: payload.webAccess === 'custom' ? 'Custom Website' : 'Basic Website',
            quantity: 1,
            unit_price: 0,
            total_price: 0
        });
    }

    if (payload.hasQR) {
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

    await tx.orderItem.createMany({
        data: orderItems
    });

    await upsertCustomerDetails(tx, userId, payload.clientInfo);

    return { order: newOrder, plan, pricing };
};

const sendGuestSetupEmail = async ({ name, email, verificationToken, orderNumber }) => {
    const frontendUrl = await getConfig('frontend_url') || 'http://localhost:9002';
    const setupPasswordLink = `${frontendUrl}/setup-password?token=${verificationToken}`;

    const emailHtml = `
        <h1>Welcome, ${name}!</h1>
        <p>Your order <strong>${orderNumber}</strong> has been created.</p>
        <p>Please <a href="${setupPasswordLink}">click here</a> to set your password and activate your account.</p>
    `;

    return trySendEmail({
        email,
        subject: 'Verify your TapToInvite account',
        message: emailHtml
    });
};

const createPaidOrderInTransaction = async (tx, userId, payload, paymentInfo) => {
    const { plan, nfcTemplate, physicalTemplates, pricing } = await buildOrderPricing(payload);

    if (!plan) {
        return { plan: null };
    }

    const newOrder = await tx.order.create({
        data: {
            order_number: payload.checkoutOrderNumber || generateOrderNumber(),
            user_id: userId,
            plan_id: payload.planId,
            event_category_id: payload.eventCategoryId,
            event_title: payload.eventTitle,
            event_date: payload.eventDate ? new Date(payload.eventDate) : null,
            digital_notes: payload.digitalNotes,
            total_amount: pricing.totalAmount,
            advance_paid: pricing.advancePaid,
            balance_amount: (pricing.totalAmount - pricing.advancePaid),
            payment_status: 'Advance_Paid',
            advance_payment_method: 'razorpay',
            transaction_id: paymentInfo.razorpay_order_id,
            order_status: 'Pending'
        }
    });

    const orderItems = [];

    orderItems.push({
        order_id: newOrder.id,
        item_type: 'PLAN_BASE',
        reference_id: payload.planId,
        item_name: plan.name,
        quantity: 1,
        unit_price: parseFloat(plan.base_price),
        total_price: parseFloat(plan.base_price)
    });

    if (payload.nfcQuantity > 0 && nfcTemplate) {
        orderItems.push({
            order_id: newOrder.id,
            item_type: 'NFC',
            reference_id: payload.nfcTemplateId,
            item_name: nfcTemplate.name,
            quantity: payload.nfcQuantity,
            unit_price: parseFloat(nfcTemplate.price),
            total_price: (payload.nfcQuantity * parseFloat(nfcTemplate.price))
        });
    }

    if (payload.normalTemplates && payload.normalTemplates.length > 0) {
        payload.normalTemplates.forEach(template => {
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

    if (payload.webAccess && payload.webAccess !== 'none') {
        orderItems.push({
            order_id: newOrder.id,
            item_type: payload.webAccess === 'custom' ? 'WEBSITE_CUSTOM' : 'WEBSITE_BASIC',
            reference_id: null,
            item_name: payload.webAccess === 'custom' ? 'Custom Website' : 'Basic Website',
            quantity: 1,
            unit_price: 0,
            total_price: 0
        });
    }

    if (payload.hasQR) {
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

    await tx.orderItem.createMany({
        data: orderItems
    });

    await upsertCustomerDetails(tx, userId, payload.clientInfo);

    return { order: newOrder, plan, pricing };
};

// --- CREATE RAZORPAY CHECKOUT ORDER ---
exports.createRazorpayPaymentOrder = async (req, res) => {
    try {
        const payload = req.body;
        const userId = req.user?.id || null;

        if (!payload.planId || !payload.eventCategoryId || !payload.eventTitle || !payload.clientInfo) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const checkoutPayload = await buildCheckoutPayload(payload, userId);

        if (!checkoutPayload.plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        if (checkoutPayload.accountExists) {
            return res.status(400).json({
                success: false,
                code: 'ACCOUNT_EXISTS',
                accountExists: true,
                email: checkoutPayload.email,
                message: 'An account already exists with this email. Please log in to continue with your purchase.',
                orderData: payload
            });
        }

        if (!checkoutPayload.payment?.created) {
            return res.status(503).json({
                success: false,
                message: 'Payment gateway is temporarily unavailable.'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Payment order created successfully.',
            data: {
                pricing: checkoutPayload.pricing,
                orderNumber: checkoutPayload.orderNumber,
                advanceAmount: checkoutPayload.pricing.advancePaid
            },
            payment: {
                razorpay_key_id: checkoutPayload.payment.razorpayKeyId,
                razorpay_order_id: checkoutPayload.payment.razorpayOrder.id,
                amount: Math.round(checkoutPayload.pricing.advancePaid * 100),
                currency: 'INR'
            }
        });
    } catch (error) {
        console.error('❌ Create Razorpay Payment Order Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment order',
            error: error.message
        });
    }
};

// --- CONFIRM PAID ORDER (UPDATED FLOW) ---
exports.confirmPaidOrder = async (req, res) => {
    try {
        const payload = req.body;
        const orderData = payload.orderData || payload;
        const payment = payload.payment || {};

        if (!orderData.orderId) {
            return res.status(400).json({
                success: false,
                message: 'Missing order ID'
            });
        }

        if (!payment.razorpay_order_id || !payment.razorpay_payment_id || !payment.razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: 'Missing Razorpay payment details'
            });
        }

        const signatureCheck = await verifyRazorpaySignature({
            razorpayOrderId: payment.razorpay_order_id,
            razorpayPaymentId: payment.razorpay_payment_id,
            razorpaySignature: payment.razorpay_signature
        });

        if (!signatureCheck.valid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Razorpay payment signature'
            });
        }

        // Find the existing order
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderData.orderId },
            include: { user: true, plan: true, items: true }
        });

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update the order to Advance_Paid
        const updatedOrder = await prisma.order.update({
            where: { id: orderData.orderId },
            data: {
                payment_status: 'Advance_Paid',
                advance_payment_method: 'razorpay',
                transaction_id: payment.razorpay_payment_id
            }
        });

        // CREATE PAYMENT RECORD for the advance amount
        await prisma.payment.create({
            data: {
                order_id: updatedOrder.id,
                transaction_id: payment.razorpay_payment_id,
                amount: existingOrder.advance_paid,
                payment_note: 'Automated advance payment via Razorpay',
                status: 'Advance_Paid',
                mode: 'online',
                transaction_date: new Date()
            }
        });

        // Send confirmation email with order details
        const emailHtml = `
            <h1>Payment Successful!</h1>
            <p>Dear ${existingOrder.user.name},</p>
            <p>We have successfully received your advance payment for Order <strong>${existingOrder.order_number}</strong>.</p>
            <p>Event: ${existingOrder.event_title}</p>
            <p>Amount Paid: INR ${existingOrder.advance_paid}</p>
            <p>Balance Amount: INR ${existingOrder.balance_amount}</p>
            <p>We will start processing your order shortly.</p>
        `;

        await trySendEmail({
            email: existingOrder.user.email,
            subject: `Payment Confirmation - Order ${existingOrder.order_number}`,
            message: emailHtml
        });

        return res.status(200).json({
            success: true,
            message: 'Payment verified and order updated successfully.',
            data: {
                orderId: updatedOrder.id,
                orderNumber: updatedOrder.order_number,
                paymentStatus: updatedOrder.payment_status
            }
        });

    } catch (error) {
        console.error('❌ Confirm Paid Order Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to verify payment',
            error: error.message
        });
    }
};

// --- PLACE ORDER ---
exports.placeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const payload = req.body;

        if (!payload.planId || !payload.eventCategoryId || !payload.eventTitle || !payload.clientInfo) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const result = await prisma.$transaction(async (tx) => createOrderForUser(tx, userId, payload));

        if (!result.plan || !result.order || !result.pricing) {
            return res.status(404).json({
                success: false,
                message: "Plan not found"
            });
        }
        const completeOrder = await prisma.order.findUnique({
            where: { id: result.order.id },
            include: {
                items: true,
                plan: { select: { name: true } },
                user: { select: { id: true, name: true, email: true } }
            }
        });

        console.log('💳 Payment Gateway Check for Order:', completeOrder.order_number);
        
        // Initialize Razorpay with credentials from SiteConfiguration
        const razorpayKeyId = await getConfig('razorpay_key_id');
        const razorpayKeySecret = await getConfig('razorpay_key_secret');

        console.log('Razorpay credentials status:', {
            keyId: razorpayKeyId ? '✓ Found' : '✗ Missing',
            keySecret: razorpayKeySecret ? '✓ Found' : '✗ Missing'
        });

        if (!razorpayKeyId || !razorpayKeySecret) {
            console.warn('⚠️  Razorpay credentials not configured. Proceeding with order without payment gateway.');
            return res.status(201).json({
                success: true,
                message: 'Order placed successfully. Payment gateway not configured.',
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
        }

        console.log('✅ Razorpay credentials found. Initializing payment...');
        try {
            const razorpay = new Razorpay({
                key_id: razorpayKeyId,
                key_secret: razorpayKeySecret
            });

            console.log('🔄 Creating Razorpay order for amount:', completeOrder.advance_paid);
            // Create Razorpay order for advance payment
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(completeOrder.advance_paid * 100), // Convert to paise
                currency: 'INR',
                receipt: completeOrder.order_number,
                notes: {
                    order_id: completeOrder.id,
                    user_id: userId,
                    order_number: completeOrder.order_number
                }
            });

            console.log('✅ Razorpay order created:', razorpayOrder.id);
            // Store Razorpay order ID in Order record
            await prisma.order.update({
                where: { id: completeOrder.id },
                data: {
                    transaction_id: razorpayOrder.id
                }
            });

            console.log('💰 Returning order with payment details');
            res.status(201).json({
                success: true,
                message: "Order placed successfully. Ready for payment.",
                data: {
                    orderId: completeOrder.id,
                    orderNumber: completeOrder.order_number,
                    totalAmount: completeOrder.total_amount,
                    advanceAmount: completeOrder.advance_paid,
                    balanceAmount: completeOrder.balance_amount,
                    items: completeOrder.items,
                    eventTitle: completeOrder.event_title
                },
                payment: {
                    razorpay_key_id: razorpayKeyId,
                    razorpay_order_id: razorpayOrder.id,
                    amount: Math.round(completeOrder.advance_paid * 100),
                    currency: 'INR'
                }
            });
        } catch (razorpayError) {
            console.error('❌ Razorpay order creation error:', razorpayError.message);
            console.log('⚠️  Returning order without payment details due to Razorpay error');
            res.status(201).json({
                success: true,
                message: 'Order placed successfully, but payment gateway is temporarily unavailable.',
                data: {
                    orderId: completeOrder.id,
                    orderNumber: completeOrder.order_number,
                    totalAmount: completeOrder.total_amount,
                    advanceAmount: completeOrder.advance_paid,
                    balanceAmount: completeOrder.balance_amount,
                    items: completeOrder.items,
                    eventTitle: completeOrder.event_title
                },
                payment_error: razorpayError.message
            });
        }
    } catch (error) {
        console.error('❌ Place Order Error:', error.message);
        res.status(500).json({
            success: false,
            message: "Failed to place order",
            error: error.message
        });
    }
};

// --- GUEST PLACE ORDER ---
exports.placeGuestOrder = async (req, res) => {
    try {
        const payload = req.body;

        if (!payload.planId || !payload.eventCategoryId || !payload.eventTitle || !payload.clientInfo) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const { name, email, phone } = payload.clientInfo;
        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Guest checkout requires name, email, and phone number.'
            });
        }

        // Check if user exists by email (strict check)
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log(`📧 Account exists for email: ${email}`);
            return res.status(400).json({
                success: false,
                message: 'An account already exists with this email. Please log in to continue with your purchase.',
                code: 'ACCOUNT_EXISTS',
                accountExists: true,
                email: email,
                orderData: payload // Return order data so frontend can resume after login
            });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const result = await prisma.$transaction(async (tx) => {
            const createdUser = await tx.user.create({
                data: {
                    name,
                    email,
                    country_code: payload.clientInfo.countryCode || '+91',
                    phone,
                    status: 'unverified',
                    verification_token: verificationToken,
                    role: 'user'
                }
            });

            await tx.userDetails.create({
                data: {
                    user_id: createdUser.id,
                    alt_phone: payload.clientInfo.altPhone || null,
                    address_line_1: payload.clientInfo.address1,
                    address_line_2: payload.clientInfo.address2 || null,
                    city: payload.clientInfo.city,
                    state: payload.clientInfo.state,
                    pincode: payload.clientInfo.pincode,
                    country: payload.clientInfo.country || 'India'
                }
            });

            const orderResult = await createOrderForUser(tx, createdUser.id, payload);

            return {
                user: createdUser,
                order: orderResult.order,
            };
        });

        const completeOrder = await prisma.order.findUnique({
            where: { id: result.order.id },
            include: {
                items: true,
                plan: { select: { name: true } }
            }
        });

        const emailResult = await sendGuestSetupEmail({
            name: result.user.name,
            email: result.user.email,
            verificationToken,
            orderNumber: completeOrder.order_number,
        });

        // Initialize Razorpay with credentials from SiteConfiguration
        const razorpayKeyId = await getConfig('razorpay_key_id');
        const razorpayKeySecret = await getConfig('razorpay_key_secret');

        console.log('💳 Payment Gateway Check for Order:', completeOrder.order_number);
        console.log('Razorpay credentials status:', {
            keyId: razorpayKeyId ? '✓ Found' : '✗ Missing',
            keySecret: razorpayKeySecret ? '✓ Found' : '✗ Missing'
        });

        if (!razorpayKeyId || !razorpayKeySecret) {
            console.warn('⚠️  Razorpay credentials not configured. Proceeding with order without payment gateway.');
            return res.status(201).json({
                success: true,
                message: emailResult.sent
                    ? 'Order placed successfully. Account setup email sent. Payment gateway not configured.'
                    : 'Order placed successfully, but the account setup email could not be sent.',
                email_sent: emailResult.sent,
                data: {
                    orderId: completeOrder.id,
                    orderNumber: completeOrder.order_number,
                    totalAmount: completeOrder.total_amount,
                    advanceAmount: completeOrder.advance_paid,
                    balanceAmount: completeOrder.balance_amount,
                    items: completeOrder.items,
                    eventTitle: completeOrder.event_title,
                    accountCreated: true,
                    passwordSetupRequired: true,
                }
            });
        }

        console.log('✅ Razorpay credentials found. Initializing payment...');
        try {
            const razorpay = new Razorpay({
                key_id: razorpayKeyId,
                key_secret: razorpayKeySecret
            });

            console.log('🔄 Creating Razorpay order for amount:', completeOrder.advance_paid);
            // Create Razorpay order for advance payment
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(completeOrder.advance_paid * 100), // Convert to paise
                currency: 'INR',
                receipt: completeOrder.order_number,
                notes: {
                    order_id: completeOrder.id,
                    user_id: result.user.id,
                    order_number: completeOrder.order_number
                }
            });

            console.log('✅ Razorpay order created:', razorpayOrder.id);
            // Store Razorpay order ID in Order record
            await prisma.order.update({
                where: { id: completeOrder.id },
                data: {
                    transaction_id: razorpayOrder.id
                }
            });

            console.log('💰 Returning order with payment details');
            res.status(201).json({
                success: true,
                message: emailResult.sent
                    ? 'Order placed successfully. Account setup email sent. Ready for payment.'
                    : 'Order placed successfully, but the account setup email could not be sent.',
                email_sent: emailResult.sent,
                data: {
                    orderId: completeOrder.id,
                    orderNumber: completeOrder.order_number,
                    totalAmount: completeOrder.total_amount,
                    advanceAmount: completeOrder.advance_paid,
                    balanceAmount: completeOrder.balance_amount,
                    items: completeOrder.items,
                    eventTitle: completeOrder.event_title,
                    accountCreated: true,
                    passwordSetupRequired: true,
                },
                payment: {
                    razorpay_key_id: razorpayKeyId,
                    razorpay_order_id: razorpayOrder.id,
                    amount: Math.round(completeOrder.advance_paid * 100),
                    currency: 'INR'
                }
            });
        } catch (razorpayError) {
            console.error('❌ Razorpay order creation error:', razorpayError.message);
            console.log('⚠️  Returning order without payment details due to Razorpay error');
            res.status(201).json({
                success: true,
                message: 'Order placed successfully, but payment gateway is temporarily unavailable.',
                email_sent: emailResult.sent,
                data: {
                    orderId: completeOrder.id,
                    orderNumber: completeOrder.order_number,
                    totalAmount: completeOrder.total_amount,
                    advanceAmount: completeOrder.advance_paid,
                    balanceAmount: completeOrder.balance_amount,
                    items: completeOrder.items,
                    eventTitle: completeOrder.event_title,
                    accountCreated: true,
                    passwordSetupRequired: true,
                },
                payment_error: razorpayError.message
            });
        }
    } catch (error) {
        console.error('❌ Guest Place Order Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to place order',
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
            where: { status: 'active' }
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
            where: { status: 'active' }
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

// --- RAZORPAY WEBHOOK HANDLER ---
exports.razorpayWebhook = async (req, res) => {
    try {
        const { event, payload } = req.body;

        // Log webhook for debugging
        console.log(`Razorpay webhook received: ${event}`, payload);

        if (!event || !payload) {
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook payload'
            });
        }

        // Handle payment authorized or payment captured events
        if (event === 'payment.authorized' || event === 'payment.captured') {
            const payment = payload.payment;

            if (!payment || !payment.entity || !payment.entity.order_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment data in webhook'
                });
            }

            // Find order by Razorpay order ID (stored in transaction_id)
            const order = await prisma.order.findFirst({
                where: { transaction_id: payment.entity.order_id }
            });

            if (!order) {
                console.warn(`Order not found for Razorpay order: ${payment.entity.order_id}`);
                return res.status(404).json({
                    success: false,
                    message: 'Order not found for this payment'
                });
            }

            // Update order with payment details
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    payment_status: 'Advance_Paid',
                    advance_payment_method: 'razorpay',
                    transaction_id: payment.entity.id  // Store Razorpay payment ID
                }
            });

            // Send confirmation email to user
            const user = await prisma.user.findUnique({
                where: { id: order.user_id }
            });

            if (user) {
                const emailHtml = `
                    <h2>Payment Received</h2>
                    <p>Thank you for your payment!</p>
                    <p>Order #<strong>${order.order_number}</strong></p>
                    <p>Amount Paid: ₹${(payment.entity.amount / 100).toFixed(2)}</p>
                    <p>Your order is now being processed. We'll keep you updated on the progress.</p>
                `;

                await trySendEmail({
                    email: user.email,
                    subject: 'Payment Received - TapToInvite Order Confirmation',
                    message: emailHtml
                });
            }

            res.status(200).json({
                success: true,
                message: 'Payment processed successfully'
            });

        } else if (event === 'payment.failed') {
            const payment = payload.payment;

            if (!payment || !payment.entity || !payment.entity.order_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid payment data in webhook'
                });
            }

            // Find order and update status
            const order = await prisma.order.findFirst({
                where: { transaction_id: payment.entity.order_id }
            });

            if (order) {
                // Payment failed, order status remains Pending
                console.warn(`Payment failed for order ${order.order_number}`);
                
                const user = await prisma.user.findUnique({
                    where: { id: order.user_id }
                });

                if (user) {
                    const emailHtml = `
                        <h2>Payment Failed</h2>
                        <p>Unfortunately, your payment for order #<strong>${order.order_number}</strong> could not be processed.</p>
                        <p>Please try again or contact support if the issue persists.</p>
                    `;

                    await trySendEmail({
                        email: user.email,
                        subject: 'Payment Failed - Please Try Again',
                        message: emailHtml
                    });
                }
            }

            res.status(200).json({
                success: true,
                message: 'Payment failure recorded'
            });

        } else {
            // Other events that we don't handle yet
            console.log(`Unhandled webhook event: ${event}`);
            res.status(200).json({
                success: false,
                message: 'Event not handled'
            });
        }
    } catch (error) {
        console.error('Razorpay Webhook Error:', error);
        res.status(500).json({
            success: false,
            message: 'Webhook processing failed'
        });
    }
};

// ─── BUY PRODUCT: Create Razorpay order for full price ──────────────────────
exports.buyProduct = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const userId = req.user?.id;

        if (!product_id || !quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Product ID and valid quantity are required.' });
        }

        const product = await prisma.postPurchaseProduct.findFirst({
            where: { id: parseInt(product_id), status: 'active' }
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found or unavailable.' });
        }

        const unitPrice = parseFloat(product.price);
        const gst = Math.round(unitPrice * quantity * 0.18);
        const totalAmount = (unitPrice * quantity) + gst;

        // Create a Razorpay order for full amount
        const orderNumber = `PROD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
        const razorpayKeyId = await getConfig('razorpay_key_id');
        const razorpayKeySecret = await getConfig('razorpay_key_secret');

        if (!razorpayKeyId || !razorpayKeySecret) {
            return res.status(503).json({ success: false, message: 'Payment gateway not configured.' });
        }

        const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: orderNumber,
            notes: { user_id: String(userId), product_id: String(product_id), product_name: product.name }
        });

        return res.status(200).json({
            success: true,
            message: 'Product payment order created.',
            data: {
                orderNumber,
                product: { id: product.id, name: product.name, price: unitPrice },
                quantity: parseInt(quantity),
                pricing: { unitPrice, gst, totalAmount }
            },
            payment: {
                razorpay_key_id: razorpayKeyId,
                razorpay_order_id: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency
            }
        });
    } catch (error) {
        console.error('Buy Product Error:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate product purchase.', error: error.message });
    }
};

// ─── CONFIRM PRODUCT PAYMENT ─────────────────────────────────────────────────
exports.confirmProductPayment = async (req, res) => {
    try {
        const { product_id, quantity, razorpay_order_id, razorpay_payment_id, razorpay_signature, order_number } = req.body;
        const userId = req.user?.id;

        // Verify signature
        const razorpayKeySecret = await getConfig('razorpay_key_secret');
        const expectedSig = crypto.createHmac('sha256', razorpayKeySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
        }

        const product = await prisma.postPurchaseProduct.findUnique({ where: { id: parseInt(product_id) } });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

        const unitPrice = parseFloat(product.price);
        const gst = Math.round(unitPrice * quantity * 0.18);
        const totalAmount = (unitPrice * quantity) + gst;

        // Record the purchase
        await prisma.productPurchase.create({
            data: {
                product_id: parseInt(product_id),
                user_id: userId,
                quantity: parseInt(quantity),
                unit_price: unitPrice,
                gst_amount: gst,
                total_amount: totalAmount,
                razorpay_order_id,
                razorpay_payment_id,
                order_number,
                status: 'Fully_Paid'
            }
        });

        // Send confirmation email
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
        if (user) {
            await trySendEmail({
                email: user.email,
                subject: `Purchase Confirmed — ${product.name}`,
                message: `<h2>Thank you, ${user.name}!</h2><p>Your purchase of <strong>${product.name}</strong> (Qty: ${quantity}) worth <strong>₹${totalAmount.toLocaleString('en-IN')}</strong> has been confirmed.</p><p>Transaction ID: ${razorpay_payment_id}</p>`
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Payment confirmed. Thank you for your purchase!',
            data: { product_name: product.name, quantity, total: totalAmount, transaction_id: razorpay_payment_id }
        });
    } catch (error) {
        console.error('Confirm Product Payment Error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm payment.', error: error.message });
    }
};

