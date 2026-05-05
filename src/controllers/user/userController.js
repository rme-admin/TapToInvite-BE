const prisma = require('../../config/db');

// --- GET PROFILE ---
exports.getProfile = async (req, res) => {
    try {
        // req.user.id comes from the verifyToken middleware
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                details: true // Join UserDetails table
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Remove sensitive data before sending
        const { password_hash, refresh_token, verification_token, ...safeUser } = user;

        res.status(200).json({
            success: true,
            data: safeUser
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// --- UPDATE PROFILE ---
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, alt_phone, address_line_1, address_line_2, city, state, pincode, country } = req.body;

        // Use a transaction to update both tables safely
        const updatedUser = await prisma.$transaction(async (tx) => {
            // Update User table
            const user = await tx.user.update({
                where: { id: userId },
                data: { name, phone }
            });

            // Update UserDetails table
            await tx.userDetails.update({
                where: { user_id: userId },
                data: {
                    alt_phone,
                    address_line_1,
                    address_line_2,
                    city,
                    state,
                    pincode,
                    country
                }
            });

            return user;
        });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: { name: updatedUser.name, phone: updatedUser.phone }
        });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// --- GET MY ORDERS (For Dashboard) ---
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await prisma.order.findMany({
            where: { user_id: userId },
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
            },
            orderBy: { created_at: 'desc' }
        });

        const normalizedOrders = orders.map(order => ({
            id: order.id,
            order_number: order.order_number,
            event_title: order.event_title,
            event_date: order.event_date,
            order_status: order.order_status,
            total_amount: order.total_amount,
            created_at: order.created_at,
            plan: order.plan,
            category: order.category,
            items: order.items,
            issued_nfc_links: order.nfc_issuances.map(issuance => ({
                id: issuance.id,
                label: issuance.nfc_card_number,
                href: issuance.generated_url,
                method: issuance.method,
                status: issuance.status,
            })),
            tracking_notes: order.tracking_notes.map(note => ({
                id: note.id,
                heading: note.heading,
                description: note.description,
                note_date: note.note_date,
                note_time: note.note_time,
                visible_to_user: note.visible_to_user,
            })),
        }));

        res.status(200).json({ success: true, data: normalizedOrders });
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};