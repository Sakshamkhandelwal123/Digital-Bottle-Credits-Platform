/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * Seeds development data if the database is empty.
 */

module.exports.bootstrap = async function () {

  // Skip seeding if users already exist
  if (await User.count() > 0) {
    sails.log.info('Database already seeded. Skipping bootstrap.');
    return;
  }

  sails.log.info('Seeding development data...');

  // Create a sample bar
  const bar = await Bar.create({
    name: 'The Tipsy Oak',
    address: '42 MG Road, Indiranagar',
    city: 'Bangalore',
    phone: '9876543210',
    licenseNumber: 'LIC-BLR-2024-001',
  }).fetch();

  // Create admin user (password: admin123)
  const admin = await User.create({
    phone: '9000000001',
    name: 'Bar Admin',
    email: 'admin@tipsyoak.com',
    password: 'admin123',
    role: 'admin',
    barId: bar.id,
  }).fetch();

  // Create staff user (password: staff123)
  const staff = await User.create({
    phone: '9000000002',
    name: 'Bartender Raj',
    email: 'raj@tipsyoak.com',
    password: 'staff123',
    role: 'staff',
    barId: bar.id,
  }).fetch();

  // Create customer user (password: customer123)
  const customer = await User.create({
    phone: '9000000003',
    name: 'Rahul Customer',
    email: 'rahul@example.com',
    password: 'customer123',
    role: 'customer',
  }).fetch();

  // Create sample bottle plans
  const plan1 = await BottlePlan.create({
    brandName: 'Johnnie Walker Black Label',
    category: 'whisky',
    totalMl: 750,
    price: 4500,
    bar: bar.id,
  }).fetch();

  const plan2 = await BottlePlan.create({
    brandName: 'Absolut Vodka',
    category: 'vodka',
    totalMl: 750,
    price: 2800,
    bar: bar.id,
  }).fetch();

  await BottlePlan.create({
    brandName: 'Old Monk Rum',
    category: 'rum',
    totalMl: 750,
    price: 1200,
    bar: bar.id,
  });

  // Create a sample wallet for the customer (as if they purchased a bottle)
  const wallet = await Wallet.create({
    brandName: plan1.brandName,
    totalCredits: plan1.totalMl,
    remainingCredits: plan1.totalMl,
    status: 'active',
    owner: customer.id,
    bar: bar.id,
    bottlePlan: plan1.id,
  }).fetch();

  // Log the initial credit transaction
  await Transaction.create({
    walletId: wallet.id,
    userId: customer.id,
    staffId: admin.id,
    barId: bar.id,
    type: 'CREDIT',
    amount: plan1.totalMl,
    pegSize: null,
    brandName: plan1.brandName,
    balanceBefore: 0,
    balanceAfter: plan1.totalMl,
    note: `Seed: Bottle plan purchased - ${plan1.brandName} (${plan1.totalMl}ml)`,
  });

  sails.log.info('Development data seeded successfully!');
  sails.log.info('---');
  sails.log.info('Sample accounts:');
  sails.log.info(`  Admin:    phone=9000000001  password=admin123`);
  sails.log.info(`  Staff:    phone=9000000002  password=staff123`);
  sails.log.info(`  Customer: phone=9000000003  password=customer123`);
  sails.log.info('---');

};
