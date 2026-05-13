const prisma = require('../../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Basic Counts
        const totalUsers = await prisma.user.count({ where: { role: 'user', status: { not: 'archived' } } });
        const totalOrders = await prisma.order.count();
        const activeSubscriptions = await prisma.userSubscription.count({ where: { status: 'ACTIVE' } });
        
        // 2. Revenue Calculation (Orders + Product Purchases)
        const totalOrderRevenue = await prisma.order.aggregate({
            _sum: { total_amount: true }
        });
        const totalProductRevenue = await prisma.productPurchase.aggregate({
            _sum: { total_amount: true }
        });
        
        const totalRevenue = (Number(totalOrderRevenue._sum.total_amount) || 0) + 
                           (Number(totalProductRevenue._sum.total_amount) || 0);

        // 3. Recent Orders (Combined Invitations and Products)
        const recentOrders = await prisma.order.findMany({
            take: 5,
            orderBy: { created_at: 'desc' },
            include: { 
                user: { select: { name: true, email: true } },
                plan: { select: { name: true } }
            }
        });

        // 4. Order Status Distribution
        const orderStatusCounts = await prisma.order.groupBy({
            by: ['order_status'],
            _count: true
        });

        // 5. Revenue Trends (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        // This is a simplified approach; in production, you might use a raw query or iterative counts
        const revenueTrends = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const month = date.getMonth();

            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

            const monthOrderRev = await prisma.order.aggregate({
                where: { created_at: { gte: startOfMonth, lte: endOfMonth } },
                _sum: { total_amount: true }
            });
            const monthProductRev = await prisma.productPurchase.aggregate({
                where: { created_at: { gte: startOfMonth, lte: endOfMonth } },
                _sum: { total_amount: true }
            });

            revenueTrends.push({
                month: monthName,
                revenue: (Number(monthOrderRev._sum.total_amount) || 0) + 
                         (Number(monthProductRev._sum.total_amount) || 0)
            });
        }

        res.status(200).json({
            success: true,
            data: {
                counters: {
                    totalUsers,
                    totalOrders,
                    activeSubscriptions,
                    totalRevenue
                },
                recentOrders,
                orderStatusCounts,
                revenueTrends
            }
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
    }
};
