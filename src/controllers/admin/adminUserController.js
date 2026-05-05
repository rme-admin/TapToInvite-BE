const prisma = require('../../config/db');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                details: true,
                _count: {
                    select: { orders: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        const normalizedUsers = users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            is_active: user.is_active,
            created_at: user.created_at,
            orders_count: user._count.orders,
            details: user.details
        }));

        res.status(200).json({ success: true, data: normalizedUsers });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
};
