const prisma = require('../config/db');

/**
 * Fetches specific config values from the database.
 * Usage: const smtpHost = await getConfig('email_smtp_host');
 */
const getConfig = async (key) => {
    try {
        const config = await prisma.siteConfiguration.findUnique({
            where: { config_key: key }
        });
        return config ? config.config_value : null;
    } catch (error) {
        console.error(`Error fetching config ${key}:`, error);
        return null;
    }
};

/**
 * Fetches an entire group of settings (e.g., all 'SMTP' settings).
 */
const getConfigGroup = async (groupName) => {
    try {
        const configs = await prisma.siteConfiguration.findMany({
            where: { config_group: groupName }
        });
        // Convert array to an object { config_key: config_value }
        return configs.reduce((acc, curr) => {
            acc[curr.config_key] = curr.config_value;
            return acc;
        }, {});
    } catch (error) {
        console.error(`Error fetching config group ${groupName}:`, error);
        return {};
    }
};

module.exports = { getConfig, getConfigGroup };