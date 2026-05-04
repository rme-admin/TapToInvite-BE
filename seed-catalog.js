const prisma = require('./src/config/db');

async function seedAllCatalog() {
  try {
    console.log('🌱 Seeding catalog data...');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:9002';

    // 1. Seed Event Categories
    console.log('📁 Creating event categories...');
    const categoryData = [
      { name: 'Wedding', slug: 'wedding', is_active: true },
      { name: 'Birthday', slug: 'birthday', is_active: true },
      { name: 'Engagement', slug: 'engagement', is_active: true },
      { name: 'House Warming', slug: 'house-warming', is_active: true },
      { name: 'Corporate', slug: 'corporate', is_active: true }
    ];

    for (const category of categoryData) {
      await prisma.eventCategory.upsert({
        where: { slug: category.slug },
        update: { name: category.name, is_active: category.is_active },
        create: category,
      });
    }

    const categories = await prisma.eventCategory.findMany();
    console.log('✓ Event categories created:', categories.length);

    // 2. Seed NFC Templates
    console.log('📱 Creating NFC templates...');
    const nfcTemplateData = [
      {
        name: 'Luxe Gold NFC',
        description: 'Premium gold-plated NFC card with photo embed',
        dimensions: '85 x 54mm',
        price: 499,
        images: ['https://picsum.photos/seed/nfc1/400/250', 'https://picsum.photos/seed/nfc1b/400/250'],
        is_active: true
      },
      {
        name: 'Sterling Silver NFC',
        description: 'Elegant silver finish with NFC technology',
        dimensions: '85 x 54mm',
        price: 549,
        images: ['https://picsum.photos/seed/nfc2/400/250', 'https://picsum.photos/seed/nfc2b/400/250'],
        is_active: true
      },
      {
        name: 'Eco Bamboo NFC',
        description: 'Sustainable bamboo NFC cards for eco-conscious events',
        dimensions: '85 x 54mm',
        price: 699,
        images: ['https://picsum.photos/seed/nfc3/400/250'],
        is_active: true
      }
    ];

    for (const template of nfcTemplateData) {
      const existingTemplate = await prisma.nfcTemplate.findFirst({ where: { name: template.name } });
      if (existingTemplate) {
        await prisma.nfcTemplate.update({
          where: { id: existingTemplate.id },
          data: template,
        });
      } else {
        await prisma.nfcTemplate.create({ data: template });
      }
    }

    const nfcTemplates = await prisma.nfcTemplate.findMany();
    console.log('✓ NFC templates created:', nfcTemplates.length);

    // 3. Seed Normal Card Templates
    console.log('🎨 Creating normal card templates...');
    const normalTemplateData = [
      {
        name: 'Royal Parchment',
        description: 'Traditional formal invitation on premium parchment',
        dimensions: 'A4 (210 x 297mm)',
        price: 45,
        images: ['https://picsum.photos/seed/card1/400/600', 'https://picsum.photos/seed/card1b/400/600'],
        is_active: true
      },
      {
        name: 'Modern Minimal',
        description: 'Clean and contemporary design for modern events',
        dimensions: 'A4 (210 x 297mm)',
        price: 35,
        images: ['https://picsum.photos/seed/card2/400/600'],
        is_active: true
      },
      {
        name: 'Vintage Floral',
        description: 'Elegant floral patterns for classic events',
        dimensions: 'A4 (210 x 297mm)',
        price: 55,
        images: ['https://picsum.photos/seed/card3/400/600', 'https://picsum.photos/seed/card3b/400/600'],
        is_active: true
      }
    ];

    for (const template of normalTemplateData) {
      const existingTemplate = await prisma.normalCardTemplate.findFirst({ where: { name: template.name } });
      if (existingTemplate) {
        await prisma.normalCardTemplate.update({
          where: { id: existingTemplate.id },
          data: template,
        });
      } else {
        await prisma.normalCardTemplate.create({ data: template });
      }
    }

    const normalTemplates = await prisma.normalCardTemplate.findMany();
    console.log('✓ Normal card templates created:', normalTemplates.length);

    // 4. Seed Site Configuration
    console.log('⚙️ Creating site configuration...');
    const siteConfigData = [
      { config_group: 'GENERAL', config_key: 'frontend_url', config_value: frontendUrl, description: 'Frontend base URL for verification and invite links' },
      { config_group: 'SMTP', config_key: 'email_smtp_host', config_value: 'smtp.gmail.com', description: 'SMTP host for outgoing verification emails' },
      { config_group: 'SMTP', config_key: 'email_port', config_value: '465', description: 'SMTP port for outgoing emails' },
      { config_group: 'SMTP', config_key: 'email_user', config_value: 'no-reply@taptoinvite.com', description: 'SMTP username / sender email' },
      { config_group: 'SMTP', config_key: 'email_app_password', config_value: 'CHANGE_ME', description: 'SMTP app password - replace with a real credential' },
      { config_group: 'SMTP', config_key: 'email_from_name', config_value: 'TapToInvite', description: 'Display name for outgoing emails' },
    ];

    for (const config of siteConfigData) {
      await prisma.siteConfiguration.upsert({
        where: { config_key: config.config_key },
        update: config,
        create: config,
      });
    }
    console.log('✓ Site configuration created:', siteConfigData.length);

    // 5. Link templates to categories
    console.log('🔗 Linking templates to categories...');
    
    // Get all created data
    const allCategories = await prisma.eventCategory.findMany();
    const allNfcTemplates = await prisma.nfcTemplate.findMany();
    const allNormalTemplates = await prisma.normalCardTemplate.findMany();

    // Create relationships (link all templates to all categories for flexibility)
    for (const nfcTemplate of allNfcTemplates) {
      for (const category of allCategories) {
        await prisma.nfcTemplateCategory.upsert({
          where: {
            nfc_template_id_event_category_id: {
              nfc_template_id: nfcTemplate.id,
              event_category_id: category.id
            }
          },
          create: {
            nfc_template_id: nfcTemplate.id,
            event_category_id: category.id
          },
          update: {}
        });
      }
    }

    for (const normalTemplate of allNormalTemplates) {
      for (const category of allCategories) {
        await prisma.normalTemplateCategory.upsert({
          where: {
            normal_template_id_event_category_id: {
              normal_template_id: normalTemplate.id,
              event_category_id: category.id
            }
          },
          create: {
            normal_template_id: normalTemplate.id,
            event_category_id: category.id
          },
          update: {}
        });
      }
    }
    console.log('✓ Templates linked to categories');

    console.log('✅ Catalog seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${allCategories.length} Event Categories`);
    console.log(`   - ${allNfcTemplates.length} NFC Templates`);
    console.log(`   - ${allNormalTemplates.length} Normal Card Templates`);
    console.log(`   - ${siteConfigData.length} Site Configuration entries`);
  } catch (error) {
    console.error('❌ Error seeding catalog:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAllCatalog().catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
