const prisma = require('../../config/db');

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION PLAN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── LIST ALL SUBSCRIPTION PLANS ─────────────────────────────────────────────
exports.getAllSubscriptionPlans = async (req, res) => {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            where: { status: { not: 'archived' } },
            include: {
                _count: { select: { user_subscriptions: true, product_plans: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json({ success: true, data: plans });
    } catch (error) {
        console.error('Get Subscription Plans Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscription plans', error: error.message });
    }
};

// ─── GET SINGLE SUBSCRIPTION PLAN ────────────────────────────────────────────
exports.getSubscriptionPlanById = async (req, res) => {
    try {
        const { id } = req.params;
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: { select: { user_subscriptions: true, product_plans: true } },
                product_plans: { select: { id: true, name: true, status: true } },
                user_subscriptions: {
                    where: { status: 'ACTIVE' },
                    take: 20,
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    },
                    orderBy: { start_date: 'desc' }
                }
            }
        });
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        console.error('Get Subscription Plan Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch plan', error: error.message });
    }
};

// ─── CREATE SUBSCRIPTION PLAN ────────────────────────────────────────────────
exports.createSubscriptionPlan = async (req, res) => {
    try {
        const { name, description, price, duration_days, features, default_reminder_config, status } = req.body;
        if (!name || !price || !duration_days) {
            return res.status(400).json({ success: false, message: 'Name, price, and duration are required.' });
        }

        let parsedFeatures = features;
        if (typeof features === 'string') { try { parsedFeatures = JSON.parse(features); } catch { parsedFeatures = null; } }
        let parsedConfig = default_reminder_config;
        if (typeof default_reminder_config === 'string') { try { parsedConfig = JSON.parse(default_reminder_config); } catch { parsedConfig = null; } }

        const plan = await prisma.subscriptionPlan.create({
            data: {
                name: String(name).trim(),
                description: description || null,
                price: parseFloat(price),
                duration_days: parseInt(duration_days),
                features: parsedFeatures || null,
                default_reminder_config: parsedConfig || null,
                status: status || 'active',
            }
        });
        res.status(201).json({ success: true, message: 'Subscription plan created.', data: plan });
    } catch (error) {
        console.error('Create Subscription Plan Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create plan', error: error.message });
    }
};

// ─── UPDATE SUBSCRIPTION PLAN ────────────────────────────────────────────────
exports.updateSubscriptionPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, duration_days, features, default_reminder_config, status } = req.body;

        const existing = await prisma.subscriptionPlan.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ success: false, message: 'Plan not found.' });

        const updateData = {};
        if (name !== undefined) updateData.name = String(name).trim();
        if (description !== undefined) updateData.description = description || null;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (duration_days !== undefined) updateData.duration_days = parseInt(duration_days);
        if (status !== undefined) updateData.status = status;

        if (features !== undefined) {
            let pf = features;
            if (typeof features === 'string') { try { pf = JSON.parse(features); } catch { pf = null; } }
            updateData.features = pf;
        }
        if (default_reminder_config !== undefined) {
            let pc = default_reminder_config;
            if (typeof pc === 'string') { try { pc = JSON.parse(pc); } catch { pc = null; } }
            updateData.default_reminder_config = pc;
        }

        const plan = await prisma.subscriptionPlan.update({ where: { id: parseInt(id) }, data: updateData });
        res.status(200).json({ success: true, message: 'Plan updated.', data: plan });
    } catch (error) {
        console.error('Update Subscription Plan Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update plan', error: error.message });
    }
};

// ─── DELETE (archive) SUBSCRIPTION PLAN ──────────────────────────────────────
exports.deleteSubscriptionPlan = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.subscriptionPlan.update({ where: { id: parseInt(id) }, data: { status: 'archived' } });
        res.status(200).json({ success: true, message: 'Subscription plan archived.' });
    } catch (error) {
        console.error('Delete Subscription Plan Error:', error);
        res.status(500).json({ success: false, message: 'Failed to archive plan', error: error.message });
    }
};

// ─── CHANGE STATUS ───────────────────────────────────────────────────────────
exports.updateSubscriptionPlanStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'inactive', 'archived'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        await prisma.subscriptionPlan.update({ where: { id: parseInt(id) }, data: { status } });
        res.status(200).json({ success: true, message: `Status set to ${status}.` });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// USER SUBSCRIPTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

// ─── LIST ALL ACTIVE SUBSCRIPTIONS ───────────────────────────────────────────
exports.getAllUserSubscriptions = async (req, res) => {
    try {
        const { status: statusFilter } = req.query;
        const where = {};
        if (statusFilter) where.status = statusFilter;

        const subs = await prisma.userSubscription.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                plan: { select: { id: true, name: true, price: true, duration_days: true } },
                assigned_by: { select: { id: true, name: true } }
            },
            orderBy: { created_at: 'desc' }
        });

        // Also get stats
        const totalActive = await prisma.userSubscription.count({ where: { status: 'ACTIVE' } });
        const totalExpired = await prisma.userSubscription.count({ where: { status: 'EXPIRED' } });
        const expiringSoon = await prisma.userSubscription.count({
            where: {
                status: 'ACTIVE',
                expiry_date: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
            }
        });

        res.status(200).json({
            success: true,
            data: subs,
            stats: { totalActive, totalExpired, expiringSoon, total: subs.length }
        });
    } catch (error) {
        console.error('Get User Subscriptions Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subscriptions', error: error.message });
    }
};

// ─── MANUALLY ASSIGN SUBSCRIPTION TO USER ────────────────────────────────────
exports.assignSubscription = async (req, res) => {
    try {
        const { user_id, subscription_plan_id, start_date, order_id, anniversary_date } = req.body;
        if (!user_id || !subscription_plan_id) {
            return res.status(400).json({ success: false, message: 'User ID and subscription plan ID are required.' });
        }

        const plan = await prisma.subscriptionPlan.findUnique({ where: { id: parseInt(subscription_plan_id) } });
        if (!plan) return res.status(404).json({ success: false, message: 'Subscription plan not found.' });

        const sDate = start_date ? new Date(start_date) : new Date();
        const eDate = new Date(sDate);
        eDate.setDate(eDate.getDate() + plan.duration_days);

        const sub = await prisma.userSubscription.create({
            data: {
                user_id: parseInt(user_id),
                subscription_plan_id: parseInt(subscription_plan_id),
                order_id: order_id ? parseInt(order_id) : null,
                start_date: sDate,
                expiry_date: eDate,
                status: 'ACTIVE',
                reminder_config: plan.default_reminder_config,
                anniversary_date: anniversary_date ? new Date(anniversary_date) : null,
                assigned_by_id: req.user.id,
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                plan: { select: { id: true, name: true } }
            }
        });

        res.status(201).json({ success: true, message: 'Subscription assigned.', data: sub });
    } catch (error) {
        console.error('Assign Subscription Error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign subscription', error: error.message });
    }
};

// ─── EXPIRE / CANCEL SUBSCRIPTION ───────────────────────────────────────────
exports.updateSubscriptionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['ACTIVE', 'EXPIRED', 'CANCELLED'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status.' });

        const sub = await prisma.userSubscription.findUnique({
            where: { id: parseInt(id) },
            include: { plan: true }
        });
        if (!sub) return res.status(404).json({ success: false, message: 'Subscription not found.' });

        // If expiring, archive to ExpiredSubscription
        if ((status === 'EXPIRED' || status === 'CANCELLED') && sub.status === 'ACTIVE') {
            await prisma.expiredSubscription.create({
                data: {
                    user_id: sub.user_id,
                    subscription_plan_id: sub.subscription_plan_id,
                    plan_name: sub.plan.name,
                    start_date: sub.start_date,
                    expiry_date: sub.expiry_date,
                    duration_days: sub.plan.duration_days,
                    price_paid: sub.plan.price,
                    order_id: sub.order_id,
                }
            });
        }

        await prisma.userSubscription.update({ where: { id: parseInt(id) }, data: { status } });
        res.status(200).json({ success: true, message: `Subscription ${status.toLowerCase()}.` });
    } catch (error) {
        console.error('Update Subscription Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// ─── RECORD SUBSCRIPTION PAYMENT ────────────────────────────────────────────
exports.recordSubscriptionPayment = async (req, res) => {
    try {
        const { subscription_id, subscription_plan_id, user_id, amount, transaction_id, mode, payment_note, status, transaction_date } = req.body;
        if (!subscription_plan_id || !user_id || !amount || !transaction_date) {
            return res.status(400).json({ success: false, message: 'Plan ID, user ID, amount, and transaction date are required.' });
        }

        const payment = await prisma.subscriptionPayment.create({
            data: {
                subscription_id: subscription_id ? parseInt(subscription_id) : null,
                subscription_plan_id: parseInt(subscription_plan_id),
                user_id: parseInt(user_id),
                amount: parseFloat(amount),
                transaction_id: transaction_id || null,
                mode: mode || 'online',
                payment_note: payment_note || null,
                status: status || 'Fully_Paid',
                transaction_date: new Date(transaction_date),
                marked_by_id: req.user.id,
            }
        });

        res.status(201).json({ success: true, message: 'Payment recorded.', data: payment });
    } catch (error) {
        console.error('Record Subscription Payment Error:', error);
        res.status(500).json({ success: false, message: 'Failed to record payment', error: error.message });
    }
};

// ─── GET SUBSCRIPTION PAYMENTS ──────────────────────────────────────────────
exports.getSubscriptionPayments = async (req, res) => {
    try {
        const { subscription_id } = req.params;
        const payments = await prisma.subscriptionPayment.findMany({
            where: { subscription_id: parseInt(subscription_id) },
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        console.error('Get Subscription Payments Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payments', error: error.message });
    }
};

// ─── GET EXPIRED SUBSCRIPTIONS (history) ────────────────────────────────────
exports.getExpiredSubscriptions = async (req, res) => {
    try {
        const { user_id } = req.query;
        const where = {};
        if (user_id) where.user_id = parseInt(user_id);

        const records = await prisma.expiredSubscription.findMany({
            where,
            include: { plan: { select: { id: true, name: true } } },
            orderBy: { expired_at: 'desc' }
        });
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        console.error('Get Expired Subscriptions Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch history', error: error.message });
    }
};
