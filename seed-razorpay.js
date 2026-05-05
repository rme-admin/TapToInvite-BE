const prisma = require('./src/config/db');

// Razorpay test mode credentials
// Get these from your Razorpay dashboard: https://dashboard.razorpay.com/
// For testing purposes, you can use test mode credentials
const RAZORPAY_TEST_CONFIGS = [
    {
        config_group: 'RAZORPAY',
        config_key: 'razorpay_key_id',
        config_value: 'rzp_test_1Aa00000000001', // Replace with your test key ID from Razorpay dashboard
        description: 'Razorpay API Key ID for test mode'
    },
    {
        config_group: 'RAZORPAY',
        config_key: 'razorpay_key_secret',
        config_value: 'test_secret_1Aa00000000001', // Replace with your test key secret from Razorpay dashboard
        description: 'Razorpay API Key Secret for test mode'
    },
    {
        config_group: 'RAZORPAY',
        config_key: 'razorpay_mode',
        config_value: 'test',
        description: 'Razorpay operating mode (test or live)'
    }
];

async function seedRazorpayConfig() {
    try {
        console.log('🚀 Starting Razorpay configuration seed...\n');

        for (const config of RAZORPAY_TEST_CONFIGS) {
            try {
                // Check if config already exists
                const existing = await prisma.siteConfiguration.findUnique({
                    where: { config_key: config.config_key }
                });

                if (existing) {
                    console.log(`⚠️  Config already exists: ${config.config_key}`);
                    console.log(`   Old value: ${existing.config_value}`);
                    
                    // Update with new value
                    await prisma.siteConfiguration.update({
                        where: { config_key: config.config_key },
                        data: {
                            config_value: config.config_value,
                            description: config.description
                        }
                    });
                    console.log(`   ✅ Updated to: ${config.config_value}\n`);
                } else {
                    // Create new config
                    await prisma.siteConfiguration.create({
                        data: config
                    });
                    console.log(`✅ Created: ${config.config_key}`);
                    console.log(`   Value: ${config.config_value}\n`);
                }
            } catch (error) {
                console.error(`❌ Error processing ${config.config_key}:`, error.message);
            }
        }

        // Verify all configs were created
        console.log('\n📋 Verifying Razorpay configuration...\n');
        const allConfigs = await prisma.siteConfiguration.findMany({
            where: { config_group: 'RAZORPAY' }
        });

        console.log(`Found ${allConfigs.length} Razorpay configurations:`);
        allConfigs.forEach(config => {
            const maskedValue = config.config_key.includes('secret') 
                ? config.config_value.substring(0, 5) + '***' + config.config_value.substring(config.config_value.length - 3)
                : config.config_value;
            console.log(`  • ${config.config_key}: ${maskedValue}`);
        });

        console.log('\n✅ Razorpay configuration seed completed successfully!');
        console.log('\n📝 IMPORTANT: Replace the test credentials with your actual Razorpay credentials:');
        console.log('   1. Go to https://dashboard.razorpay.com/');
        console.log('   2. Navigate to Settings → API Keys');
        console.log('   3. Copy your Test Key ID and Test Key Secret');
        console.log('   4. Update seed-razorpay.js with your actual credentials');
        console.log('   5. Re-run: node seed-razorpay.js');

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seedRazorpayConfig();
