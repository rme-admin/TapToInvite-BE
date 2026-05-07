const prisma = require('../../config/db');

// ─── LIST ALL USERS ──────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { status: { not: 'archived' } },
            include: {
                details: true,
                _count: {
                    select: { orders: true, tickets: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const normalizedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            country_code: user.country_code,
            role: user.role,
            status: user.status,
            created_at: user.created_at,
            orders_count: user._count.orders,
            tickets_count: user._count.tickets,
            details: user.details
        }));

        res.status(200).json({ success: true, data: normalizedUsers });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
};

// ─── GET USER DETAIL (with orders + tickets) ─────────────────────────────────
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: {
                details: true,
                orders: {
                    orderBy: { created_at: 'desc' },
                    take: 20,
                    select: {
                        id: true,
                        order_number: true,
                        order_status: true,
                        payment_status: true,
                        total_amount: true,
                        created_at: true,
                        category: { select: { id: true, name: true } },
                        plan: { select: { id: true, name: true } }
                    }
                },
                tickets: {
                    orderBy: { created_at: 'desc' },
                    include: {
                        created_by: { select: { id: true, name: true } }
                    }
                },
                _count: {
                    select: { orders: true, tickets: true }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Remove sensitive fields
        const { password_hash, refresh_token, verification_token, reset_token, reset_token_expiry, reset_otp, reset_otp_expiry, ...safeUser } = user;

        res.status(200).json({ success: true, data: safeUser });
    } catch (error) {
        console.error('Get User Detail Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
    }
};

// ─── UPDATE USER STATUS ──────────────────────────────────────────────────────
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'unverified', 'disabled', 'archived'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        res.status(200).json({ success: true, message: `User status set to ${status}.` });
    } catch (error) {
        console.error('Update User Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
};

// ─── SOFT DELETE (archive) ───────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { status: 'archived' }
        });

        res.status(200).json({ success: true, message: 'User archived successfully.' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ success: false, message: 'Failed to archive user', error: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TICKET MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate ticket number: TKT-YYYYMMDD-XXXX
 */
const generateTicketNumber = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `TKT-${dateStr}-`;

    const lastTicket = await prisma.ticket.findFirst({
        where: { ticket_number: { startsWith: prefix } },
        orderBy: { ticket_number: 'desc' }
    });

    let seq = 1;
    if (lastTicket) {
        const lastSeq = parseInt(lastTicket.ticket_number.split('-').pop(), 10);
        seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
};

// ─── CREATE TICKET ───────────────────────────────────────────────────────────
exports.createTicket = async (req, res) => {
    try {
        const { user_id, heading, description } = req.body;
        const adminId = req.user.id; // logged-in admin

        if (!user_id || !heading) {
            return res.status(400).json({ success: false, message: 'user_id and heading are required.' });
        }

        // Verify user exists
        const user = await prisma.user.findUnique({ where: { id: parseInt(user_id) } });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const ticket_number = await generateTicketNumber();

        const ticket = await prisma.ticket.create({
            data: {
                ticket_number,
                heading: String(heading).trim(),
                description: description ? String(description).trim() : null,
                user_id: parseInt(user_id),
                created_by_id: adminId,
                updates: []
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                created_by: { select: { id: true, name: true } }
            }
        });

        res.status(201).json({ success: true, message: 'Ticket created.', data: ticket });
    } catch (error) {
        console.error('Create Ticket Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create ticket', error: error.message });
    }
};

// ─── UPDATE TICKET (add update entry + optionally change status) ─────────────
exports.updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { heading, note, status } = req.body;
        const adminId = req.user.id;
        const adminName = req.user.name;

        const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

        const existingUpdates = Array.isArray(ticket.updates) ? ticket.updates : [];

        // Add an update entry
        const newUpdate = {
            date: new Date().toISOString(),
            heading: heading || null,
            note: note || null,
            updatedById: adminId,
            updatedByName: adminName
        };

        const updateData = {
            updates: [...existingUpdates, newUpdate]
        };

        if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
            updateData.status = status;
        }

        const updated = await prisma.ticket.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                user: { select: { id: true, name: true, email: true } },
                created_by: { select: { id: true, name: true } }
            }
        });

        res.status(200).json({ success: true, message: 'Ticket updated.', data: updated });
    } catch (error) {
        console.error('Update Ticket Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update ticket', error: error.message });
    }
};

// ─── GET ALL TICKETS (optionally filter by user_id) ──────────────────────────
exports.getAllTickets = async (req, res) => {
    try {
        const { user_id } = req.query;

        const where = {};
        if (user_id) where.user_id = parseInt(user_id);

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { created_at: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                created_by: { select: { id: true, name: true } }
            }
        });

        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        console.error('Get Tickets Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
    }
};

// ─── GET SINGLE TICKET ──────────────────────────────────────────────────────
exports.getTicketById = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.ticket.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true } },
                created_by: { select: { id: true, name: true } }
            }
        });

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

        res.status(200).json({ success: true, data: ticket });
    } catch (error) {
        console.error('Get Ticket Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch ticket', error: error.message });
    }
};
