const prisma = require('./src/config/db');

async function verifyCatalog() {
  try {
    console.log('📊 Verifying catalog data...\n');

    // Count all data
    const categories = await prisma.eventCategory.findMany({ include: { _count: { select: { nfc_templates: true, normal_templates: true } } } });
    const nfcTemplates = await prisma.nfcTemplate.findMany({ include: { _count: { select: { categories: true } } } });
    const normalTemplates = await prisma.normalCardTemplate.findMany({ include: { _count: { select: { categories: true } } } });

    console.log('📁 Event Categories:');
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (NFC: ${cat._count.nfc_templates}, Normal: ${cat._count.normal_templates})`);
    });

    console.log('\n📱 NFC Templates:');
    nfcTemplates.forEach(nfc => {
      console.log(`   - ${nfc.name} ($${nfc.price}) - Categories: ${nfc._count.categories}`);
    });

    console.log('\n🎨 Normal Card Templates:');
    normalTemplates.forEach(card => {
      console.log(`   - ${card.name} ($${card.price}) - Categories: ${card._count.categories}`);
    });

    console.log('\n✅ Catalog verification complete!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCatalog();
