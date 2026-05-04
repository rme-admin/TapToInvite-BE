const prisma = require('./src/config/db');

async function seedProductPlans() {
  try {
    console.log('🌱 Seeding product plans...');

    // Check if plans already exist
    const existingPlans = await prisma.productPlan.findMany();
    if (existingPlans.length > 0) {
      console.log('✓ Product plans already exist. Skipping seed.');
      return;
    }

    // Create Classic Plan
    const classicPlan = await prisma.productPlan.create({
      data: {
        name: 'Classic Invitation',
        description: 'Traditional elegance with a digital touch via QR. Perfect for simple but elegant invitations.',
        base_price: 200,
        is_recommended: false,
        min_nfc_qty: 0,
        min_normal_qty: 0,
        features: ['Normal Wedding Card', 'Active QR Code', 'No Web Access'],
        icon_url: 'https://api.iconify.design/mdi/card-multiple.svg?color=%23666666',
        status: 'active'
      }
    });

    // Create Premium Plan
    const premiumPlan = await prisma.productPlan.create({
      data: {
        name: 'Premium Invitation',
        description: 'The perfect balance of physical luxury and digital convenience. Includes NFC cards and web access.',
        base_price: 2500,
        is_recommended: true,
        min_nfc_qty: 2,
        min_normal_qty: 10,
        features: ['2 NFC Cards with Photo', 'Selected Normal Invites', 'QR Code', 'Basic Web Access', 'Basic Reminders'],
        icon_url: 'https://api.iconify.design/mdi/crown.svg?color=%23FFD700',
        status: 'active'
      }
    });

    console.log('✓ Classic Plan created:', classicPlan.name);
    console.log('✓ Premium Plan created:', premiumPlan.name);
    console.log('✅ Product plans seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding product plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedProductPlans().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
