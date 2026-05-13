const prisma = require('../../config/db');

exports.createCustomPlanRequest = async (req, res) => {
    try {
        const { name, email, phone, requirements } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and phone are required.'
            });
        }

        const request = await prisma.customPlanRequest.create({
            data: {
                name,
                email,
                phone,
                requirements
            }
        });

        res.status(201).json({
            success: true,
            message: 'Custom plan request submitted successfully. Our team will contact you soon.',
            data: request
        });
    } catch (error) {
        console.error('Create Custom Plan Request Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit request',
            error: error.message
        });
    }
};
