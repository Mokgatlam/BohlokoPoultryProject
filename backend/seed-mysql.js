/**
 * MySQL Seed Script
 * 
 * Populates the MySQL database with comprehensive demonstration data.
 * 
 * Usage: node seed-mysql.js
 */

const knex = require('knex');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bohloko_farm'
  }
});

// Helper function to generate UUID
const generateId = () => uuidv4();

// Helper function to hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Helper function to generate order number
const generateOrderNumber = () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

// Helper function to generate batch number
const generateBatchNumber = (prefix = 'BATCH') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

async function seedDatabase() {
  console.log('🌱 Starting MySQL database seeding...\n');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db('contactMessages').del();
    await db('passwordResets').del();
    await db('notifications').del();
    await db('employees').del();
    await db('apiKeys').del();
    await db('systemLogs').del();
    await db('notificationConfigs').del();
    await db('systemConfig').del();
    await db('audits').del();
    await db('complianceRecords').del();
    await db('qualityChecks').del();
    await db('promotionalCampaigns').del();
    await db('feedbackComplaints').del();
    await db('pointsTransactions').del();
    await db('customerEnrollments').del();
    await db('loyaltyPrograms').del();
    await db('customerProfiles').del();
    await db('inventory').del();
    await db('processingStaff').del();
    await db('processingQualityChecks').del();
    await db('yieldRecords').del();
    await db('processingBatches').del();
    await db('processingSteps').del();
    await db('harvestBatches').del();
    await db('environmentRecords').del();
    await db('feedRecords').del();
    await db('weightRecords').del();
    await db('vaccinations').del();
    await db('healthChecks').del();
    await db('medications').del();
    await db('dailyLogs').del();
    await db('productionCycles').del();
    await db('carts').del();
    await db('payments').del();
    await db('orders').del();
    await db('products').del();
    await db('users').del();

    console.log('✅ Existing data cleared\n');

    // ========== USERS ==========
    console.log('👥 Creating users...');
    
    const adminPassword = await hashPassword('Admin@123');
    const staffPassword = await hashPassword('Staff@123');
    const consumerPassword = await hashPassword('Consumer@123');
    const restaurantPassword = await hashPassword('Restaurant@123');
    const retailerPassword = await hashPassword('Retailer@123');
    const distributorPassword = await hashPassword('Distributor@123');
    const institutionPassword = await hashPassword('Institution@123');

    const adminId = generateId();
    const staff1Id = generateId();
    const staff2Id = generateId();
    const consumer1Id = generateId();
    const consumer2Id = generateId();
    const restaurant1Id = generateId();
    const retailer1Id = generateId();
    const distributor1Id = generateId();
    const institution1Id = generateId();
    const pendingUserId = generateId();

    await db('users').insert([
      {
        id: adminId, firstName: 'Thabo', lastName: 'Bohloko', email: 'admin@bohlokofarm.co.za',
        password: adminPassword, userType: 'Staff', role: 'Farm Manager', status: 'approved',
        phone: '+27821234567', address: JSON.stringify({ street: '12 Farm Road', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' })
      },
      {
        id: staff1Id, firstName: 'John', lastName: 'Doe', email: 'john@bohlokofarm.co.za',
        password: staffPassword, userType: 'Staff', role: 'Poultry Attendant', status: 'approved',
        phone: '+27822345678', address: JSON.stringify({ street: '45 Worker Lane', city: 'Bloemfontein', province: 'Free State', postalCode: '9301' })
      },
      {
        id: staff2Id, firstName: 'Sarah', lastName: 'Mokoena', email: 'sarah@bohlokofarm.co.za',
        password: staffPassword, userType: 'Staff', role: 'Production Supervisor', status: 'approved',
        phone: '+27823456789', address: JSON.stringify({ street: '78 Staff Avenue', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' })
      },
      {
        id: consumer1Id, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com',
        password: consumerPassword, userType: 'Consumer', role: 'Customer', status: 'approved',
        phone: '+27824567890', address: JSON.stringify({ street: '101 Main Street', city: 'Johannesburg', province: 'Gauteng', postalCode: '2000' })
      },
      {
        id: consumer2Id, firstName: 'David', lastName: 'Nkosi', email: 'david@example.com',
        password: consumerPassword, userType: 'Consumer', role: 'Customer', status: 'approved',
        phone: '+27825678901', address: JSON.stringify({ street: '202 Oak Avenue', city: 'Cape Town', province: 'Western Cape', postalCode: '8000' })
      },
      {
        id: restaurant1Id, firstName: 'Maria', lastName: 'Garcia', email: 'maria@spicekitchen.co.za',
        password: restaurantPassword, userType: 'Restaurant', role: 'Customer', status: 'approved',
        phone: '+27826789012', businessName: 'Spice Kitchen Restaurant', businessRegNumber: 'REG-2024-001', taxId: 'TAX-987654',
        address: JSON.stringify({ street: '55 Food Lane', city: 'Pretoria', province: 'Gauteng', postalCode: '0001' })
      },
      {
        id: retailer1Id, firstName: 'Pieter', lastName: 'Van Der Berg', email: 'pieter@greenstore.co.za',
        password: retailerPassword, userType: 'Retailer', role: 'Customer', status: 'approved',
        phone: '+27827890123', businessName: 'Green Store Supermarket', businessRegNumber: 'REG-2024-002', taxId: 'TAX-543210',
        address: JSON.stringify({ street: '88 Commerce Road', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4000' })
      },
      {
        id: distributor1Id, firstName: 'Nomsa', lastName: 'Dlamini', email: 'nomsa@freshdistribute.co.za',
        password: distributorPassword, userType: 'Distributor', role: 'Customer', status: 'approved',
        phone: '+27828901234', businessName: 'Fresh Distribution Pty Ltd', businessRegNumber: 'REG-2024-003', taxId: 'TAX-112233',
        address: JSON.stringify({ street: '12 Industrial Park', city: 'Port Elizabeth', province: 'Eastern Cape', postalCode: '6000' })
      },
      {
        id: institution1Id, firstName: 'Admin', lastName: 'School', email: 'admin@brightschool.edu.za',
        password: institutionPassword, userType: 'Institution', role: 'Customer', status: 'approved',
        phone: '+27829012345', businessName: 'Bright Future School', businessRegNumber: 'REG-2024-004', taxId: 'TAX-998877',
        address: JSON.stringify({ street: '15 Education Drive', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' })
      },
      {
        id: pendingUserId, firstName: 'Alex', lastName: 'Johnson', email: 'alex@example.com',
        password: await hashPassword('Pending@123'), userType: 'Consumer', role: 'Customer', status: 'pending',
        phone: '+27830123456', address: JSON.stringify({ street: '99 New Street', city: 'Johannesburg', province: 'Gauteng', postalCode: '2001' })
      }
    ]);

    console.log('✅ Created 10 users\n');

    // ========== LOYALTY PROGRAM ==========
    console.log('🎁 Creating loyalty program...');
    
    const loyaltyProgramId = generateId();
    await db('loyaltyPrograms').insert({
      id: loyaltyProgramId, name: 'Bohloko Rewards',
      description: 'Earn points with every purchase! 0.1 points per Rand spent.',
      tiers: JSON.stringify([
        { name: 'Bronze', minPoints: 0, discount: 0 },
        { name: 'Silver', minPoints: 1000, discount: 5 },
        { name: 'Gold', minPoints: 2500, discount: 10 },
        { name: 'Platinum', minPoints: 5000, discount: 15 },
        { name: 'Diamond', minPoints: 10000, discount: 20 }
      ]),
      pointsPerRand: 0.1,
      rewards: JSON.stringify([
        { name: 'Free Delivery', points: 200, description: 'Free delivery on your next order' },
        { name: '10% Discount', points: 500, description: '10% off your next order' },
        { name: 'Free Product', points: 1500, description: 'Free whole chicken with your order' }
      ]),
      active: true
    });

    console.log('✅ Created loyalty program\n');

    // ========== CUSTOMER PROFILES ==========
    console.log('👤 Creating customer profiles...');
    
    const profile1Id = generateId();
    const profile2Id = generateId();
    const profile3Id = generateId();
    const profile4Id = generateId();
    const profile5Id = generateId();

    await db('customerProfiles').insert([
      {
        id: profile1Id, userId: consumer1Id, firstName: 'Jane', lastName: 'Smith',
        email: 'jane@example.com', phone: '+27824567890', userType: 'Consumer',
        address: JSON.stringify({ street: '101 Main Street', city: 'Johannesburg', province: 'Gauteng', postalCode: '2000' }),
        preferences: JSON.stringify({ communication: 'email', newsletter: true, promotions: true }),
        stats: JSON.stringify({ totalOrders: 8, totalSpent: 4800, averageOrderValue: 600, firstOrderDate: '2025-01-15', lastOrderDate: '2026-07-20', orderFrequency: 2 }),
        loyalty: JSON.stringify({ tier: 'Gold', points: 2800, programId: loyaltyProgramId, enrolledAt: '2025-02-01' }),
        lifetimeValue: JSON.stringify({ historical: 4800, predicted: 7200, retentionProbability: 0.75 }),
        segment: 'Returning', notes: JSON.stringify([])
      },
      {
        id: profile2Id, userId: consumer2Id, firstName: 'David', lastName: 'Nkosi',
        email: 'david@example.com', phone: '+27825678901', userType: 'Consumer',
        address: JSON.stringify({ street: '202 Oak Avenue', city: 'Cape Town', province: 'Western Cape', postalCode: '8000' }),
        preferences: JSON.stringify({ communication: 'sms', newsletter: true, promotions: false }),
        stats: JSON.stringify({ totalOrders: 3, totalSpent: 2100, averageOrderValue: 700, firstOrderDate: '2026-03-10', lastOrderDate: '2026-07-15', orderFrequency: 1 }),
        loyalty: JSON.stringify({ tier: 'Silver', points: 1200, programId: loyaltyProgramId, enrolledAt: '2026-04-01' }),
        lifetimeValue: JSON.stringify({ historical: 2100, predicted: 4200, retentionProbability: 0.55 }),
        segment: 'Returning', notes: JSON.stringify([])
      },
      {
        id: profile3Id, userId: restaurant1Id, firstName: 'Maria', lastName: 'Garcia',
        email: 'maria@spicekitchen.co.za', phone: '+27826789012', userType: 'Restaurant',
        address: JSON.stringify({ street: '55 Food Lane', city: 'Pretoria', province: 'Gauteng', postalCode: '0001' }),
        preferences: JSON.stringify({ communication: 'email', newsletter: true, promotions: true }),
        stats: JSON.stringify({ totalOrders: 25, totalSpent: 45000, averageOrderValue: 1800, firstOrderDate: '2025-06-01', lastOrderDate: '2026-07-28', orderFrequency: 8 }),
        loyalty: JSON.stringify({ tier: 'Platinum', points: 5200, programId: loyaltyProgramId, enrolledAt: '2025-07-01' }),
        lifetimeValue: JSON.stringify({ historical: 45000, predicted: 112500, retentionProbability: 0.92 }),
        segment: 'VIP', notes: JSON.stringify([])
      },
      {
        id: profile4Id, userId: retailer1Id, firstName: 'Pieter', lastName: 'Van Der Berg',
        email: 'pieter@greenstore.co.za', phone: '+27827890123', userType: 'Retailer',
        address: JSON.stringify({ street: '88 Commerce Road', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4000' }),
        preferences: JSON.stringify({ communication: 'email', newsletter: false, promotions: true }),
        stats: JSON.stringify({ totalOrders: 15, totalSpent: 82000, averageOrderValue: 5466.67, firstOrderDate: '2025-09-01', lastOrderDate: '2026-07-25', orderFrequency: 5 }),
        loyalty: JSON.stringify({ tier: 'Diamond', points: 10500, programId: loyaltyProgramId, enrolledAt: '2025-10-01' }),
        lifetimeValue: JSON.stringify({ historical: 82000, predicted: 205000, retentionProbability: 0.95 }),
        segment: 'VIP', notes: JSON.stringify([])
      },
      {
        id: profile5Id, userId: institution1Id, firstName: 'Admin', lastName: 'School',
        email: 'admin@brightschool.edu.za', phone: '+27829012345', userType: 'Institution',
        address: JSON.stringify({ street: '15 Education Drive', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' }),
        preferences: JSON.stringify({ communication: 'email', newsletter: true, promotions: true }),
        stats: JSON.stringify({ totalOrders: 6, totalSpent: 18000, averageOrderValue: 3000, firstOrderDate: '2026-01-10', lastOrderDate: '2026-07-01', orderFrequency: 1 }),
        loyalty: JSON.stringify({ tier: 'Gold', points: 2600, programId: loyaltyProgramId, enrolledAt: '2026-02-01' }),
        lifetimeValue: JSON.stringify({ historical: 18000, predicted: 45000, retentionProbability: 0.65 }),
        segment: 'Returning', notes: JSON.stringify([])
      }
    ]);

    console.log('✅ Created 5 customer profiles\n');

    // ========== PRODUCTION CYCLES ==========
    console.log('🏭 Creating production cycles...');
    
    const cycle1Id = generateId();
    const cycle2Id = generateId();
    const cycle3Id = generateId();
    const cycle4Id = generateId();

    await db('productionCycles').insert([
      {
        id: cycle1Id, cycleName: 'Cycle 2026-Q1', productionType: 'Broiler Cycle',
        expectedBirds: 500, actualBirds: 500, startDate: '2026-01-15', expectedEndDate: '2026-03-15',
        status: 'Completed', createdBy: adminId, approvedBy: adminId, approvedAt: new Date('2026-01-14')
      },
      {
        id: cycle2Id, cycleName: 'Cycle 2026-Q2', productionType: 'Broiler Cycle',
        expectedBirds: 750, actualBirds: 750, startDate: '2026-04-01', expectedEndDate: '2026-06-01',
        status: 'Completed', createdBy: adminId, approvedBy: adminId, approvedAt: new Date('2026-03-30')
      },
      {
        id: cycle3Id, cycleName: 'Cycle 2026-Q3', productionType: 'Broiler Cycle',
        expectedBirds: 1000, actualBirds: 1000, startDate: '2026-07-01', expectedEndDate: '2026-09-01',
        status: 'In Progress', createdBy: adminId, approvedBy: adminId, approvedAt: new Date('2026-06-28')
      },
      {
        id: cycle4Id, cycleName: 'Cycle 2026-Q4 (Planned)', productionType: 'Egg Production',
        expectedBirds: 300, startDate: '2026-10-01', expectedEndDate: '2026-12-31',
        status: 'Planned', createdBy: adminId
      }
    ]);

    console.log('✅ Created 4 production cycles\n');

    // ========== DAILY LOGS ==========
    console.log('📝 Creating daily logs...');
    
    const dailyLogs = [];
    const cycle3Start = new Date('2026-07-01');
    for (let i = 0; i < 35; i++) {
      const logDate = new Date(cycle3Start);
      logDate.setDate(logDate.getDate() + i);
      const birdCount = 1000 - Math.floor(i * 0.5);
      dailyLogs.push({
        id: generateId(), cycle: cycle3Id, date: logDate.toISOString().split('T')[0],
        birdCount: birdCount,
        mortality: JSON.stringify({ count: Math.floor(Math.random() * 5), rate: ((Math.floor(Math.random() * 5) / 1000) * 100).toFixed(2) }),
        feedConsumption: JSON.stringify({ type: i < 14 ? 'Starter' : (i < 28 ? 'Grower' : 'Finisher'), quantityKg: 80 + (i * 2) }),
        issues: i === 10 ? 'Minor respiratory symptoms observed in 3 birds' : '',
        recordedBy: staff1Id
      });
    }
    await db('dailyLogs').insert(dailyLogs);

    console.log('✅ Created 35 daily logs\n');

    // ========== INVENTORY ==========
    console.log('📦 Creating inventory items...');
    
    const inv1Id = generateId();
    const inv2Id = generateId();
    const inv3Id = generateId();
    const inv4Id = generateId();
    const inv5Id = generateId();
    const inv6Id = generateId();

    await db('inventory').insert([
      {
        id: inv1Id, cycle: cycle3Id, productType: 'Whole Chicken', quantity: 200, weight: 400,
        batchNumber: generateBatchNumber('BATCH'), harvestDate: '2026-07-28', expiryDate: '2026-08-02',
        storageLocation: 'Cold Storage A', pricePerUnit: 120, status: 'available', createdBy: staff2Id
      },
      {
        id: inv2Id, cycle: cycle3Id, productType: 'Chicken Breast', quantity: 150, weight: 75,
        batchNumber: generateBatchNumber('BATCH'), harvestDate: '2026-07-28', expiryDate: '2026-08-02',
        storageLocation: 'Cold Storage A', pricePerUnit: 85, status: 'available', createdBy: staff2Id
      },
      {
        id: inv3Id, cycle: cycle3Id, productType: 'Chicken Thighs', quantity: 120, weight: 60,
        batchNumber: generateBatchNumber('BATCH'), harvestDate: '2026-07-28', expiryDate: '2026-08-02',
        storageLocation: 'Cold Storage B', pricePerUnit: 75, status: 'available', createdBy: staff2Id
      },
      {
        id: inv4Id, cycle: cycle3Id, productType: 'Chicken Wings', quantity: 180, weight: 45,
        batchNumber: generateBatchNumber('BATCH'), harvestDate: '2026-07-28', expiryDate: '2026-08-02',
        storageLocation: 'Cold Storage B', pricePerUnit: 65, status: 'available', createdBy: staff2Id
      },
      {
        id: inv5Id, cycle: cycle3Id, productType: 'Chicken Livers', quantity: 50, weight: 25,
        batchNumber: generateBatchNumber('BATCH'), harvestDate: '2026-07-28', expiryDate: '2026-08-01',
        storageLocation: 'Freezer A', pricePerUnit: 45, status: 'available', createdBy: staff2Id
      },
      {
        id: inv6Id, cycle: cycle3Id, productType: 'Eggs (30 pack)', quantity: 100, weight: 18,
        batchNumber: generateBatchNumber('BATCH'), harvestDate: '2026-07-25', expiryDate: '2026-08-08',
        storageLocation: 'Cold Storage C', pricePerUnit: 95, status: 'available', createdBy: staff2Id
      }
    ]);

    console.log('✅ Created 6 inventory items\n');

    // ========== ORDERS ==========
    console.log('🛒 Creating orders...');
    
    const order1Id = generateId();
    const order2Id = generateId();
    const order3Id = generateId();
    const order4Id = generateId();
    const order5Id = generateId();

    await db('orders').insert([
      {
        id: order1Id, orderNumber: generateOrderNumber(), customer: consumer1Id,
        items: JSON.stringify([
          { product: inv1Id, productName: 'Whole Chicken', quantity: 5, unit: 'pieces', pricePerUnit: 120, total: 600 },
          { product: inv2Id, productName: 'Chicken Breast', quantity: 3, unit: 'pieces', pricePerUnit: 85, total: 255 }
        ]),
        subtotal: 855, tax: 128.25, shippingCost: 0, total: 983.25,
        deliveryOption: 'pickup', paymentMethod: 'bank_transfer', paymentStatus: 'Paid',
        status: 'Delivered', notes: 'Please pack separately'
      },
      {
        id: order2Id, orderNumber: generateOrderNumber(), customer: consumer2Id,
        items: JSON.stringify([
          { product: inv6Id, productName: 'Eggs (30 pack)', quantity: 2, unit: 'packs', pricePerUnit: 95, total: 190 },
          { product: inv3Id, productName: 'Chicken Thighs', quantity: 4, unit: 'pieces', pricePerUnit: 75, total: 300 }
        ]),
        subtotal: 490, tax: 73.50, shippingCost: 50, total: 613.50,
        deliveryOption: 'local_delivery', deliveryAddress: '202 Oak Avenue, Cape Town, 8000',
        paymentMethod: 'mobile_money', paymentStatus: 'Paid',
        status: 'Shipped', notes: 'Deliver before 2pm'
      },
      {
        id: order3Id, orderNumber: generateOrderNumber(), customer: restaurant1Id,
        items: JSON.stringify([
          { product: inv1Id, productName: 'Whole Chicken', quantity: 20, unit: 'pieces', pricePerUnit: 120, total: 2400 },
          { product: inv2Id, productName: 'Chicken Breast', quantity: 15, unit: 'pieces', pricePerUnit: 85, total: 1275 },
          { product: inv4Id, productName: 'Chicken Wings', quantity: 25, unit: 'pieces', pricePerUnit: 65, total: 1625 }
        ]),
        subtotal: 5300, tax: 795, shippingCost: 0, total: 6095,
        deliveryOption: 'farm_gate', paymentMethod: 'bank_transfer', paymentStatus: 'Paid',
        status: 'Processing', notes: 'Weekly restaurant order - need by Friday'
      },
      {
        id: order4Id, orderNumber: generateOrderNumber(), customer: retailer1Id,
        items: JSON.stringify([
          { product: inv1Id, productName: 'Whole Chicken', quantity: 50, unit: 'pieces', pricePerUnit: 120, total: 6000 },
          { product: inv3Id, productName: 'Chicken Thighs', quantity: 30, unit: 'pieces', pricePerUnit: 75, total: 2250 },
          { product: inv6Id, productName: 'Eggs (30 pack)', quantity: 40, unit: 'packs', pricePerUnit: 95, total: 3800 }
        ]),
        subtotal: 12050, tax: 1807.50, shippingCost: 0, total: 13857.50,
        deliveryOption: 'farm_gate', paymentMethod: 'bank_transfer', paymentStatus: 'Paid',
        status: 'Confirmed', notes: 'Bulk order for supermarket chain'
      },
      {
        id: order5Id, orderNumber: generateOrderNumber(), customer: institution1Id,
        items: JSON.stringify([
          { product: inv1Id, productName: 'Whole Chicken', quantity: 15, unit: 'pieces', pricePerUnit: 120, total: 1800 },
          { product: inv6Id, productName: 'Eggs (30 pack)', quantity: 10, unit: 'packs', pricePerUnit: 95, total: 950 }
        ]),
        subtotal: 2750, tax: 412.50, shippingCost: 50, total: 3212.50,
        deliveryOption: 'local_delivery', deliveryAddress: '15 Education Drive, Bloemfontein, 9300',
        paymentMethod: 'bank_transfer', paymentStatus: 'Pending',
        status: 'Pending', notes: 'School catering order - monthly'
      }
    ]);

    console.log('✅ Created 5 orders\n');

    // ========== FEEDBACK ==========
    console.log('💬 Creating feedback records...');
    
    await db('feedbackComplaints').insert([
      {
        id: generateId(), customerId: consumer1Id, userId: consumer1Id, customerName: 'Jane Smith',
        type: 'feedback', category: 'Product Quality', subject: 'Excellent chicken quality!',
        message: 'The whole chickens I received were fresh and well-packaged. Will definitely order again!',
        rating: 5, orderId: order1Id, status: 'Resolved',
        response: 'Thank you for your kind words, Jane! We take pride in our quality.',
        respondedBy: adminId, respondedAt: new Date(), resolvedAt: new Date(), priority: 'Low'
      },
      {
        id: generateId(), customerId: consumer2Id, userId: consumer2Id, customerName: 'David Nkosi',
        type: 'complaint', category: 'Delivery', subject: 'Delivery was late',
        message: 'My order was supposed to arrive by 2pm but only came at 4pm. The eggs were slightly cracked.',
        rating: 2, orderId: order2Id, status: 'Responded', priority: 'High',
        response: 'We apologize for the delay, David. We are investigating the delivery issue.',
        respondedBy: adminId, respondedAt: new Date()
      },
      {
        id: generateId(), customerId: restaurant1Id, userId: restaurant1Id, customerName: 'Maria Garcia',
        type: 'suggestion', category: 'Products', subject: 'Request for bulk packaging',
        message: 'It would be great if you could offer bulk packaging options for restaurants. 50+ pieces in a single box.',
        status: 'Open', priority: 'Medium'
      }
    ]);

    console.log('✅ Created 3 feedback records\n');

    // ========== CAMPAIGNS ==========
    console.log('📢 Creating promotional campaigns...');
    
    await db('promotionalCampaigns').insert([
      {
        id: generateId(), name: 'Winter Warmer Special',
        description: 'Get 15% off on all chicken products this winter!',
        type: 'discount', channel: 'email',
        subject: 'Stay Warm with Bohloko Farm - 15% Off!',
        content: 'Dear valued customer, enjoy 15% off all our fresh chicken products this winter. Use code WINTER15 at checkout.',
        targetAudience: 'all', discount: 15, discountType: 'percentage',
        startDate: '2026-06-01', endDate: '2026-08-31',
        status: 'Active', createdBy: adminId,
        stats: JSON.stringify({ sent: 150, opened: 98, clicked: 45, converted: 22, revenue: 18500 })
      },
      {
        id: generateId(), name: 'New Customer Welcome',
        description: 'Special discount for new customers on their first order',
        type: 'promotion', channel: 'email',
        subject: 'Welcome to Bohloko Family Farm!',
        content: 'Welcome! Enjoy 10% off your first order. Use code WELCOME10 at checkout.',
        targetAudience: 'new_customers', discount: 10, discountType: 'percentage',
        startDate: '2026-01-01', status: 'Active', createdBy: adminId,
        stats: JSON.stringify({ sent: 45, opened: 38, clicked: 20, converted: 12, revenue: 7200 })
      }
    ]);

    console.log('✅ Created 2 campaigns\n');

    // ========== LOYALTY ENROLLMENTS ==========
    console.log('🎁 Creating loyalty enrollments...');
    
    await db('customerEnrollments').insert([
      { id: generateId(), customerId: profile1Id, userId: consumer1Id, programId: loyaltyProgramId, tier: 'Gold', points: 2800, enrolledAt: new Date(), active: true },
      { id: generateId(), customerId: profile2Id, userId: consumer2Id, programId: loyaltyProgramId, tier: 'Silver', points: 1200, enrolledAt: new Date(), active: true },
      { id: generateId(), customerId: profile3Id, userId: restaurant1Id, programId: loyaltyProgramId, tier: 'Platinum', points: 5200, enrolledAt: new Date(), active: true },
      { id: generateId(), customerId: profile4Id, userId: retailer1Id, programId: loyaltyProgramId, tier: 'Diamond', points: 10500, enrolledAt: new Date(), active: true },
      { id: generateId(), customerId: profile5Id, userId: institution1Id, programId: loyaltyProgramId, tier: 'Gold', points: 2600, enrolledAt: new Date(), active: true }
    ]);

    console.log('✅ Created 5 loyalty enrollments\n');

    // ========== SYSTEM CONFIG ==========
    console.log('⚙️  Creating system configuration...');
    
    await db('systemConfig').insert([
      { id: generateId(), key: 'taxRate', value: JSON.stringify(15) },
      { id: generateId(), key: 'shippingLocal', value: JSON.stringify(50) },
      { id: generateId(), key: 'currency', value: JSON.stringify('ZAR') },
      { id: generateId(), key: 'currencySymbol', value: JSON.stringify('R') }
    ]);

    console.log('✅ Created system configuration\n');

    // ========== SUMMARY ==========
    console.log('\n========================================');
    console.log('🌱 SEED DATA CREATED SUCCESSFULLY!');
    console.log('========================================\n');
    console.log('LOGIN CREDENTIALS:');
    console.log('─────────────────────────────────────────');
    console.log('Admin:          admin@bohlokofarm.co.za / Admin@123');
    console.log('Staff:          john@bohlokofarm.co.za / Staff@123');
    console.log('Staff:          sarah@bohlokofarm.co.za / Staff@123');
    console.log('Consumer:       jane@example.com / Consumer@123');
    console.log('Consumer:       david@example.com / Consumer@123');
    console.log('Restaurant:     maria@spicekitchen.co.za / Restaurant@123');
    console.log('Retailer:       pieter@greenstore.co.za / Retailer@123');
    console.log('Distributor:    nomsa@freshdistribute.co.za / Distributor@123');
    console.log('Institution:    admin@brightschool.edu.za / Institution@123');
    console.log('Pending:        alex@example.com / Pending@123');
    console.log('─────────────────────────────────────────\n');
    console.log('DATA SUMMARY:');
    console.log('─────────────────────────────────────────');
    console.log('Users:              10');
    console.log('Production Cycles:  4');
    console.log('Daily Logs:         35');
    console.log('Inventory Items:    6');
    console.log('Orders:             5');
    console.log('Customer Profiles:  5');
    console.log('Loyalty Enrollments: 5');
    console.log('Feedback:           3');
    console.log('Campaigns:          2');
    console.log('─────────────────────────────────────────\n');

    await db.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await db.destroy();
    process.exit(1);
  }
}

seedDatabase();
