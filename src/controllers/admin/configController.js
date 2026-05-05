const prisma = require('../../config/db');

/**
 * Derives config_group from key prefix when creating new rows.
 */
const deriveGroup = (key) => {
    if (key.startsWith('email') || key.startsWith('smtp')) return 'SMTP';
    if (key.startsWith('razorpay') || key.startsWith('payment')) return 'PAYMENT';
    if (key.startsWith('advance') || key.startsWith('gst') || key.startsWith('delivery')) return 'BUSINESS';
    return 'GENERAL';
};

// GET all config values as a flat map with audit info joined from User
exports.getAllConfigs = async (req, res) => {
    try {
        const configs = await prisma.siteConfiguration.findMany({
            orderBy: { config_group: 'asc' },
            include: {
                updated_by: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        // Return flat map: config_key -> { value, group, description, updatedBy, updatedAt }
        const flat = {};
        configs.forEach(c => {
            flat[c.config_key] = {
                value: c.config_value,
                group: c.config_group,
                description: c.description || null,
                updatedById: c.updated_by_id || null,
                updatedByName: c.updated_by?.name || c.updated_by?.email || null,
                updatedAt: c.updated_at || null,
            };
        });

        res.status(200).json({ success: true, data: flat });
    } catch (error) {
        console.error('Get All Configs Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch configs', error: error.message });
    }
};

// PUT — upsert only the changed keys, recording updated_by_id from the authenticated admin
exports.updateConfigs = async (req, res) => {
    try {
        const { configs } = req.body; // Array of { key, value }

        if (!Array.isArray(configs) || configs.length === 0) {
            return res.status(400).json({ success: false, message: 'No config keys to update.' });
        }

        const updatedById = req.user?.id || null;
        const now = new Date();

        await prisma.$transaction(
            configs.map(({ key, value }) =>
                prisma.siteConfiguration.upsert({
                    where: { config_key: key },
                    update: {
                        config_value: String(value ?? ''),
                        updated_by_id: updatedById,
                        updated_at: now,
                    },
                    create: {
                        config_key: key,
                        config_value: String(value ?? ''),
                        config_group: deriveGroup(key),
                        updated_by_id: updatedById,
                        updated_at: now,
                    }
                })
            )
        );

        res.status(200).json({
            success: true,
            message: `${configs.length} key(s) updated successfully.`
        });
    } catch (error) {
        console.error('Update Configs Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update configuration.', error: error.message });
    }
};
