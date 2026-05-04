const prisma = require('./src/config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function run() {
  try {
    console.log('Creating admin user and test order...');

    const adminEmail = 'admin+local@taptoinvite.test';
    const adminPhone = '+911234567890';
    const password = 'Password123!';
    const passwordHash = await bcrypt.hash(password, 10);

    // Upsert admin user
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: 'Local Admin',
        phone: adminPhone,
        password_hash: passwordHash,
        role: 'admin',
        status: 'active'
      },
      create: {
        name: 'Local Admin',
        email: adminEmail,
        phone: adminPhone,
        password_hash: passwordHash,
        role: 'admin',
        status: 'active'
      }
    });

    console.log('Admin user id:', adminUser.id, adminEmail, password);

    // Find an active plan
    const plan = await prisma.productPlan.findFirst({ where: { status: 'active' } });
    const category = await prisma.eventCategory.findFirst();

    if (!plan || !category) {
      throw new Error('No plan or category found. Ensure seeds ran.');
    }

    // Create an order
    const orderNumber = `TEST-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const newOrder = await prisma.order.create({
      data: {
        order_number: orderNumber,
        user_id: adminUser.id,
        plan_id: plan.id,
        event_category_id: category.id,
        event_title: 'Local Test Event',
        event_date: new Date(),
        digital_notes: 'Automated test order',
        total_amount: plan.base_price,
        advance_paid: 0,
        balance_amount: plan.base_price,
        payment_status: 'Pending',
        order_status: 'Pending'
      }
    });

    // Create order item for plan
    await prisma.orderItem.create({
      data: {
        order_id: newOrder.id,
        item_type: 'PLAN_BASE',
        reference_id: plan.id,
        item_name: plan.name,
        quantity: 1,
        unit_price: plan.base_price,
        total_price: plan.base_price
      }
    });

    console.log('Created test order:', newOrder.id, newOrder.order_number);
    process.exit(0);
  } catch (err) {
    console.error('Error creating test order:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
