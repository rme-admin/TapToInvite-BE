const prisma = require('../../config/db');

exports.getCustomPlanRequests = async (req, res) => {
    try {
        const requests = await prisma.customPlanRequest.findMany({
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get Custom Plan Requests Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch requests',
            error: error.message
        });
    }
};

exports.updateCustomPlanRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_note } = req.body;

        const updated = await prisma.customPlanRequest.update({
            where: { id: parseInt(id) },
            data: {
                status,
                admin_note
            }
        });

        res.status(200).json({
            success: true,
            message: 'Request updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Update Custom Plan Request Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update request',
            error: error.message
        });
    }
};

exports.deleteCustomPlanRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.customPlanRequest.delete({
            where: { id: parseInt(id) }
        });
        res.status(200).json({
            success: true,
            message: 'Request deleted successfully'
        });
    } catch (error) {
        console.error('Delete Custom Plan Request Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete request',
            error: error.message
        });
    }
};
