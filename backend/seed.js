const User = require('./models/User');
const SystemConfig = require('./models/SystemConfig');
const { ProductionCycle, DailyLog, Medication, HealthCheck, Vaccination, WeightRecord, FeedRecord, EnvironmentRecord } = require('./models/Production');
const Inventory = require('./models/Inventory');
const Order = require('./models/Order');
const CustomerProfile = require('./models/CustomerProfile');
const { LoyaltyProgram, PointsTransaction, CustomerEnrollment } = require('./models/Loyalty');
const Feedback = require('./models/Feedback');
const Campaign = require('./models/Campaign');

const seedDB = async () => {
  try {
    console.log('Clearing existing data...');
    await User.deleteMany({});

    // ========== USERS ==========
    console.log('Creating users...');
    const admin = await User.create({
      firstName: 'Thabo', lastName: 'Bohloko', email: 'admin@bohlokofarm.co.za',
      password: 'Admin@123', userType: 'Staff', role: 'Farm Manager', status: 'approved', phone: '+27821234567',
      address: { street: '12 Farm Road', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' }
    });

    const staff1 = await User.create({
      firstName: 'John', lastName: 'Doe', email: 'john@bohlokofarm.co.za',
      password: 'Staff@123', userType: 'Staff', role: 'Poultry Attendant', status: 'approved', phone: '+27822345678',
      address: { street: '45 Worker Lane', city: 'Bloemfontein', province: 'Free State', postalCode: '9301' }
    });

    const staff2 = await User.create({
      firstName: 'Sarah', lastName: 'Mokoena', email: 'sarah@bohlokofarm.co.za',
      password: 'Staff@123', userType: 'Staff', role: 'Production Supervisor', status: 'approved', phone: '+27823456789',
      address: { street: '78 Staff Avenue', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' }
    });

    const consumer1 = await User.create({
      firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com',
      password: 'Consumer@123', userType: 'Consumer', role: 'Customer', status: 'approved', phone: '+27824567890',
      address: { street: '101 Main Street', city: 'Johannesburg', province: 'Gauteng', postalCode: '2000' }
    });

    const consumer2 = await User.create({
      firstName: 'David', lastName: 'Nkosi', email: 'david@example.com',
      password: 'Consumer@123', userType: 'Consumer', role: 'Customer', status: 'approved', phone: '+27825678901',
      address: { street: '202 Oak Avenue', city: 'Cape Town', province: 'Western Cape', postalCode: '8000' }
    });

    const restaurant1 = await User.create({
      firstName: 'Maria', lastName: 'Garcia', email: 'maria@spicekitchen.co.za',
      password: 'Restaurant@123', userType: 'Restaurant', role: 'Customer', status: 'approved', phone: '+27826789012',
      businessName: 'Spice Kitchen Restaurant', businessRegNumber: 'REG-2024-001', taxId: 'TAX-987654',
      address: { street: '55 Food Lane', city: 'Pretoria', province: 'Gauteng', postalCode: '0001' }
    });

    const retailer1 = await User.create({
      firstName: 'Pieter', lastName: 'Van Der Berg', email: 'pieter@greenstore.co.za',
      password: 'Retailer@123', userType: 'Retailer', role: 'Customer', status: 'approved', phone: '+27827890123',
      businessName: 'Green Store Supermarket', businessRegNumber: 'REG-2024-002', taxId: 'TAX-543210',
      address: { street: '88 Commerce Road', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4000' }
    });

    const distributor1 = await User.create({
      firstName: 'Nomsa', lastName: 'Dlamini', email: 'nomsa@freshdistribute.co.za',
      password: 'Distributor@123', userType: 'Distributor', role: 'Customer', status: 'approved', phone: '+27828901234',
      businessName: 'Fresh Distribution Pty Ltd', businessRegNumber: 'REG-2024-003', taxId: 'TAX-112233',
      address: { street: '12 Industrial Park', city: 'Port Elizabeth', province: 'Eastern Cape', postalCode: '6000' }
    });

    const institution1 = await User.create({
      firstName: 'Admin', lastName: 'School', email: 'admin@brightschool.edu.za',
      password: 'Institution@123', userType: 'Institution', role: 'Customer', status: 'approved', phone: '+27829012345',
      businessName: 'Bright Future School', businessRegNumber: 'REG-2024-004', taxId: 'TAX-998877',
      address: { street: '15 Education Drive', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' }
    });

    const pendingUser = await User.create({
      firstName: 'Alex', lastName: 'Johnson', email: 'alex@example.com',
      password: 'Pending@123', userType: 'Consumer', role: 'Customer', status: 'pending', phone: '+27830123456',
      address: { street: '99 New Street', city: 'Johannesburg', province: 'Gauteng', postalCode: '2001' }
    });

    console.log(`Created ${10} users`);

    // ========== LOYALTY PROGRAM ==========
    console.log('Creating loyalty program...');
    const loyaltyProgram = await LoyaltyProgram.create({
      name: 'Bohloko Rewards',
      description: 'Earn points with every purchase! 0.1 points per Rand spent.',
      tiers: [
        { name: 'Bronze', minPoints: 0, discount: 0 },
        { name: 'Silver', minPoints: 1000, discount: 5 },
        { name: 'Gold', minPoints: 2500, discount: 10 },
        { name: 'Platinum', minPoints: 5000, discount: 15 },
        { name: 'Diamond', minPoints: 10000, discount: 20 }
      ],
      pointsPerRand: 0.1,
      rewards: [
        { name: 'Free Delivery', points: 200, description: 'Free delivery on your next order' },
        { name: '10% Discount', points: 500, description: '10% off your next order' },
        { name: 'Free Product', points: 1500, description: 'Free whole chicken with your order' }
      ]
    });

    // ========== CUSTOMER PROFILES ==========
    console.log('Creating customer profiles...');
    const profile1 = await CustomerProfile.create({
      userId: consumer1._id, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com',
      phone: '+27824567890', userType: 'Consumer',
      address: { street: '101 Main Street', city: 'Johannesburg', province: 'Gauteng', postalCode: '2000' },
      communication: 'email', newsletter: true, promotions: true
    });
    await CustomerProfile.update(profile1._id, {
      stats: { totalOrders: 8, totalSpent: 4800, averageOrderValue: 600,
        firstOrderDate: new Date('2025-01-15'), lastOrderDate: new Date('2026-07-20'),
        orderFrequency: 2 },
      loyalty: { tier: 'Gold', points: 2800, programId: loyaltyProgram._id, enrolledAt: new Date('2025-02-01') },
      lifetimeValue: { historical: 4800, predicted: 7200, retentionProbability: 0.75 },
      segment: 'Returning'
    });

    const profile2 = await CustomerProfile.create({
      userId: consumer2._id, firstName: 'David', lastName: 'Nkosi', email: 'david@example.com',
      phone: '+27825678901', userType: 'Consumer',
      address: { street: '202 Oak Avenue', city: 'Cape Town', province: 'Western Cape', postalCode: '8000' },
      communication: 'sms', newsletter: true, promotions: false
    });
    await CustomerProfile.update(profile2._id, {
      stats: { totalOrders: 3, totalSpent: 2100, averageOrderValue: 700,
        firstOrderDate: new Date('2026-03-10'), lastOrderDate: new Date('2026-07-15'),
        orderFrequency: 1 },
      loyalty: { tier: 'Silver', points: 1200, programId: loyaltyProgram._id, enrolledAt: new Date('2026-04-01') },
      lifetimeValue: { historical: 2100, predicted: 4200, retentionProbability: 0.55 },
      segment: 'Returning'
    });

    const profile3 = await CustomerProfile.create({
      userId: restaurant1._id, firstName: 'Maria', lastName: 'Garcia', email: 'maria@spicekitchen.co.za',
      phone: '+27826789012', userType: 'Restaurant',
      address: { street: '55 Food Lane', city: 'Pretoria', province: 'Gauteng', postalCode: '0001' },
      communication: 'email', newsletter: true, promotions: true
    });
    await CustomerProfile.update(profile3._id, {
      stats: { totalOrders: 25, totalSpent: 45000, averageOrderValue: 1800,
        firstOrderDate: new Date('2025-06-01'), lastOrderDate: new Date('2026-07-28'),
        orderFrequency: 8 },
      loyalty: { tier: 'Platinum', points: 5200, programId: loyaltyProgram._id, enrolledAt: new Date('2025-07-01') },
      lifetimeValue: { historical: 45000, predicted: 112500, retentionProbability: 0.92 },
      segment: 'VIP'
    });

    const profile4 = await CustomerProfile.create({
      userId: retailer1._id, firstName: 'Pieter', lastName: 'Van Der Berg', email: 'pieter@greenstore.co.za',
      phone: '+27827890123', userType: 'Retailer',
      address: { street: '88 Commerce Road', city: 'Durban', province: 'KwaZulu-Natal', postalCode: '4000' },
      communication: 'email', newsletter: false, promotions: true
    });
    await CustomerProfile.update(profile4._id, {
      stats: { totalOrders: 15, totalSpent: 82000, averageOrderValue: 5466.67,
        firstOrderDate: new Date('2025-09-01'), lastOrderDate: new Date('2026-07-25'),
        orderFrequency: 5 },
      loyalty: { tier: 'Diamond', points: 10500, programId: loyaltyProgram._id, enrolledAt: new Date('2025-10-01') },
      lifetimeValue: { historical: 82000, predicted: 205000, retentionProbability: 0.95 },
      segment: 'VIP'
    });

    const profile5 = await CustomerProfile.create({
      userId: institution1._id, firstName: 'Admin', lastName: 'School', email: 'admin@brightschool.edu.za',
      phone: '+27829012345', userType: 'Institution',
      address: { street: '15 Education Drive', city: 'Bloemfontein', province: 'Free State', postalCode: '9300' },
      communication: 'email', newsletter: true, promotions: true
    });
    await CustomerProfile.update(profile5._id, {
      stats: { totalOrders: 6, totalSpent: 18000, averageOrderValue: 3000,
        firstOrderDate: new Date('2026-01-10'), lastOrderDate: new Date('2026-07-01'),
        orderFrequency: 1 },
      loyalty: { tier: 'Gold', points: 2600, programId: loyaltyProgram._id, enrolledAt: new Date('2026-02-01') },
      lifetimeValue: { historical: 18000, predicted: 45000, retentionProbability: 0.65 },
      segment: 'Returning'
    });

    console.log('Created 5 customer profiles');

    // ========== PRODUCTION CYCLES ==========
    console.log('Creating production cycles...');
    const cycle1 = await ProductionCycle.create({
      cycleName: 'Cycle 2026-Q1',
      productionType: 'Broiler Cycle',
      expectedBirds: 500,
      actualBirds: 500,
      startDate: new Date('2026-01-15'),
      expectedEndDate: new Date('2026-03-15'),
      status: 'Completed',
      createdBy: admin._id,
      approvedBy: admin._id,
      approvedAt: new Date('2026-01-14')
    });

    const cycle2 = await ProductionCycle.create({
      cycleName: 'Cycle 2026-Q2',
      productionType: 'Broiler Cycle',
      expectedBirds: 750,
      actualBirds: 750,
      startDate: new Date('2026-04-01'),
      expectedEndDate: new Date('2026-06-01'),
      status: 'Completed',
      createdBy: admin._id,
      approvedBy: admin._id,
      approvedAt: new Date('2026-03-30')
    });

    const cycle3 = await ProductionCycle.create({
      cycleName: 'Cycle 2026-Q3',
      productionType: 'Broiler Cycle',
      expectedBirds: 1000,
      actualBirds: 1000,
      startDate: new Date('2026-07-01'),
      expectedEndDate: new Date('2026-09-01'),
      status: 'In Progress',
      createdBy: admin._id,
      approvedBy: admin._id,
      approvedAt: new Date('2026-06-28')
    });

    const cycle4 = await ProductionCycle.create({
      cycleName: 'Cycle 2026-Q4 (Planned)',
      productionType: 'Egg Production',
      expectedBirds: 300,
      startDate: new Date('2026-10-01'),
      expectedEndDate: new Date('2026-12-31'),
      status: 'Planned',
      createdBy: admin._id
    });

    console.log('Created 4 production cycles');

    // ========== DAILY LOGS (for cycle3 - In Progress) ==========
    console.log('Creating daily logs...');
    const cycle3Start = new Date('2026-07-01');
    for (let i = 0; i < 35; i++) {
      const logDate = new Date(cycle3Start);
      logDate.setDate(logDate.getDate() + i);
      const birdCount = 1000 - Math.floor(i * 0.5);
      await DailyLog.create({
        cycle: cycle3._id,
        date: logDate,
        birdCount: birdCount,
        mortality: { count: Math.floor(Math.random() * 5), rate: ((Math.floor(Math.random() * 5) / 1000) * 100).toFixed(2) },
        feedConsumption: { type: i < 14 ? 'Starter' : (i < 28 ? 'Grower' : 'Finisher'), quantityKg: 80 + (i * 2) },
        issues: i === 10 ? 'Minor respiratory symptoms observed in 3 birds' : '',
        recordedBy: staff1._id
      });
    }
    console.log('Created 35 daily logs');

    // ========== MEDICATIONS ==========
    console.log('Creating medication records...');
    await Medication.create({
      cycle: cycle3._id, medicationName: 'Vitamins A & D Supplement',
      dosage: '5ml per liter of water', date: new Date('2026-07-05'),
      status: 'Completed', administeredBy: staff1._id,
      expiryDate: new Date('2027-07-01'), medicationType: 'Supplement',
      notes: 'Routine vitamin supplementation for chick development'
    });

    await Medication.create({
      cycle: cycle3._id, medicationName: 'Antibiotic (Oxytetracycline)',
      dosage: '20mg per bird', date: new Date('2026-07-12'),
      status: 'Completed', administeredBy: staff1._id,
      expiryDate: new Date('2027-06-01'), medicationType: 'Antibiotic',
      notes: 'Treated respiratory symptoms in 3 birds', completedAt: new Date('2026-07-12')
    });

    await Medication.create({
      cycle: cycle3._id, medicationName: 'Electrolyte Solution',
      dosage: '2ml per liter of water', date: new Date('2026-07-20'),
      status: 'Completed', administeredBy: staff2._id,
      expiryDate: new Date('2027-05-01'), medicationType: 'Supplement',
      notes: 'Heat stress prevention - high temperature days'
    });

    await Medication.create({
      cycle: cycle3._id, medicationName: 'Dewormer (Levamisole)',
      dosage: '10mg per bird', date: new Date('2026-08-01'),
      status: 'Scheduled', administeredBy: staff1._id,
      expiryDate: new Date('2027-08-01'), medicationType: 'Dewormer',
      notes: 'Scheduled deworming for week 5'
    });

    console.log('Created 4 medication records');

    // ========== HEALTH CHECKS ==========
    console.log('Creating health check records...');
    const healthStatuses = ['Excellent', 'Good', 'Good', 'Excellent', 'Good'];
    for (let i = 0; i < 5; i++) {
      const checkDate = new Date(cycle3Start);
      checkDate.setDate(checkDate.getDate() + (i * 7));
      await HealthCheck.create({
        cycle: cycle3._id,
        date: checkDate,
        overallHealth: healthStatuses[i],
        birdsChecked: 1000,
        inspectedBy: staff2._id,
        notes: i === 1 ? 'All birds showing good growth, no signs of disease' : 'Routine health inspection - all normal'
      });
    }
    console.log('Created 5 health check records');

    // ========== VACCINATIONS ==========
    console.log('Creating vaccination records...');
    await Vaccination.create({
      cycle: cycle3._id, vaccineName: 'Newcastle Disease (NDV)',
      scheduledDate: new Date('2026-07-08'), dosage: '0.5ml per bird',
      status: 'Completed', completedDate: new Date('2026-07-08'),
      completedBy: staff1._id, createdBy: admin._id
    });

    await Vaccination.create({
      cycle: cycle3._id, vaccineName: 'Infectious Bronchitis (IB)',
      scheduledDate: new Date('2026-07-15'), dosage: '0.5ml per bird',
      status: 'Completed', completedDate: new Date('2026-07-15'),
      completedBy: staff1._id, createdBy: admin._id
    });

    await Vaccination.create({
      cycle: cycle3._id, vaccineName: 'Gumboro Disease (IBD)',
      scheduledDate: new Date('2026-07-22'), dosage: '1ml per bird (drinking water)',
      status: 'Completed', completedDate: new Date('2026-07-22'),
      completedBy: staff2._id, createdBy: admin._id
    });

    await Vaccination.create({
      cycle: cycle3._id, vaccineName: 'Newcastle Disease (NDV) Booster',
      scheduledDate: new Date('2026-08-05'), dosage: '0.5ml per bird',
      status: 'Scheduled', createdBy: admin._id
    });

    await Vaccination.create({
      cycle: cycle3._id, vaccineName: 'Fowl Pox',
      scheduledDate: new Date('2026-08-12'), dosage: '0.02ml per bird (wing web)',
      status: 'Scheduled', createdBy: admin._id
    });

    console.log('Created 5 vaccination records');

    // ========== WEIGHT RECORDS ==========
    console.log('Creating weight records...');
    for (let week = 1; week <= 5; week++) {
      const recordDate = new Date(cycle3Start);
      recordDate.setDate(recordDate.getDate() + (week * 7));
      const avgWeight = (week * 0.25) + (Math.random() * 0.1);
      await WeightRecord.create({
        cycle: cycle3._id,
        date: recordDate,
        averageWeight: parseFloat(avgWeight.toFixed(2)),
        sampleSize: 50,
        recordedBy: staff1._id
      });
    }
    console.log('Created 5 weight records');

    // ========== FEED RECORDS ==========
    console.log('Creating feed records...');
    const feedTypes = ['Starter', 'Starter', 'Starter', 'Starter', 'Grower', 'Grower', 'Grower', 'Grower', 'Finisher', 'Finisher', 'Finisher', 'Finisher', 'Finisher'];
    for (let i = 0; i < 13; i++) {
      const recordDate = new Date(cycle3Start);
      recordDate.setDate(recordDate.getDate() + (i * 3));
      await FeedRecord.create({
        cycle: cycle3._id,
        date: recordDate,
        feedType: feedTypes[i],
        quantityKg: 60 + (i * 8) + Math.floor(Math.random() * 10),
        recordedBy: staff1._id
      });
    }
    console.log('Created 13 feed records');

    // ========== ENVIRONMENT RECORDS ==========
    console.log('Creating environment records...');
    for (let i = 0; i < 35; i++) {
      const recordDate = new Date(cycle3Start);
      recordDate.setDate(recordDate.getDate() + i);
      const temp = 28 + (Math.random() * 6);
      const humidity = 55 + (Math.random() * 20);
      await EnvironmentRecord.create({
        cycle: cycle3._id,
        date: recordDate,
        temperature: parseFloat(temp.toFixed(1)),
        humidity: parseFloat(humidity.toFixed(1)),
        notes: temp > 33 ? 'High temperature - increased ventilation' : 'Normal conditions',
        recordedBy: staff1._id
      });
    }
    console.log('Created 35 environment records');

    // ========== INVENTORY ==========
    console.log('Creating inventory items...');
    const inv1 = await Inventory.create({
      cycle: cycle3._id, productType: 'Whole Chicken', quantity: 200, weight: 400,
      batchNumber: 'BATCH-2026-001', harvestDate: new Date('2026-07-28'),
      expiryDate: new Date('2026-08-02'), storageLocation: 'Cold Storage A',
      pricePerUnit: 120, status: 'available', createdBy: staff2._id
    });

    const inv2 = await Inventory.create({
      cycle: cycle3._id, productType: 'Chicken Breast', quantity: 150, weight: 75,
      batchNumber: 'BATCH-2026-002', harvestDate: new Date('2026-07-28'),
      expiryDate: new Date('2026-08-02'), storageLocation: 'Cold Storage A',
      pricePerUnit: 85, status: 'available', createdBy: staff2._id
    });

    const inv3 = await Inventory.create({
      cycle: cycle3._id, productType: 'Chicken Thighs', quantity: 120, weight: 60,
      batchNumber: 'BATCH-2026-003', harvestDate: new Date('2026-07-28'),
      expiryDate: new Date('2026-08-02'), storageLocation: 'Cold Storage B',
      pricePerUnit: 75, status: 'available', createdBy: staff2._id
    });

    const inv4 = await Inventory.create({
      cycle: cycle3._id, productType: 'Chicken Wings', quantity: 180, weight: 45,
      batchNumber: 'BATCH-2026-004', harvestDate: new Date('2026-07-28'),
      expiryDate: new Date('2026-08-02'), storageLocation: 'Cold Storage B',
      pricePerUnit: 65, status: 'available', createdBy: staff2._id
    });

    const inv5 = await Inventory.create({
      cycle: cycle3._id, productType: 'Chicken Livers', quantity: 50, weight: 25,
      batchNumber: 'BATCH-2026-005', harvestDate: new Date('2026-07-28'),
      expiryDate: new Date('2026-08-01'), storageLocation: 'Freezer A',
      pricePerUnit: 45, status: 'available', createdBy: staff2._id
    });

    const inv6 = await Inventory.create({
      cycle: cycle3._id, productType: 'Eggs (30 pack)', quantity: 100, weight: 18,
      batchNumber: 'BATCH-2026-006', harvestDate: new Date('2026-07-25'),
      expiryDate: new Date('2026-08-08'), storageLocation: 'Cold Storage C',
      pricePerUnit: 95, status: 'available', createdBy: staff2._id
    });

    const inv7 = await Inventory.create({
      cycle: cycle3._id, productType: 'Whole Chicken', quantity: 50, weight: 100,
      batchNumber: 'BATCH-2026-007', harvestDate: new Date('2026-07-15'),
      expiryDate: new Date('2026-07-20'), storageLocation: 'Cold Storage A',
      pricePerUnit: 120, status: 'sold', createdBy: staff2._id
    });

    const inv8 = await Inventory.create({
      cycle: cycle2._id, productType: 'Whole Chicken', quantity: 30, weight: 60,
      batchNumber: 'BATCH-2026-OLD', harvestDate: new Date('2026-05-25'),
      expiryDate: new Date('2026-05-30'), storageLocation: 'Cold Storage A',
      pricePerUnit: 115, status: 'expired', createdBy: staff2._id
    });

    console.log('Created 8 inventory items');

    // ========== ORDERS ==========
    console.log('Creating orders...');
    const order1 = await Order.create({
      customer: consumer1._id,
      items: [
        { product: inv1._id, productName: 'Whole Chicken', quantity: 5, unit: 'pieces', pricePerUnit: 120, total: 600 },
        { product: inv2._id, productName: 'Chicken Breast', quantity: 3, unit: 'pieces', pricePerUnit: 85, total: 255 }
      ],
      subtotal: 855, tax: 128.25, shippingCost: 0, total: 983.25,
      deliveryOption: 'pickup', paymentMethod: 'bank_transfer', paymentStatus: 'Paid',
      status: 'Delivered', notes: 'Please pack separately'
    });

    const order2 = await Order.create({
      customer: consumer2._id,
      items: [
        { product: inv6._id, productName: 'Eggs (30 pack)', quantity: 2, unit: 'packs', pricePerUnit: 95, total: 190 },
        { product: inv3._id, productName: 'Chicken Thighs', quantity: 4, unit: 'pieces', pricePerUnit: 75, total: 300 }
      ],
      subtotal: 490, tax: 73.50, shippingCost: 50, total: 613.50,
      deliveryOption: 'local_delivery', deliveryAddress: '202 Oak Avenue, Cape Town, 8000',
      paymentMethod: 'mobile_money', paymentStatus: 'Paid',
      status: 'Shipped', notes: 'Deliver before 2pm'
    });

    const order3 = await Order.create({
      customer: restaurant1._id,
      items: [
        { product: inv1._id, productName: 'Whole Chicken', quantity: 20, unit: 'pieces', pricePerUnit: 120, total: 2400 },
        { product: inv2._id, productName: 'Chicken Breast', quantity: 15, unit: 'pieces', pricePerUnit: 85, total: 1275 },
        { product: inv4._id, productName: 'Chicken Wings', quantity: 25, unit: 'pieces', pricePerUnit: 65, total: 1625 }
      ],
      subtotal: 5300, tax: 795, shippingCost: 0, total: 6095,
      deliveryOption: 'farm_gate', paymentMethod: 'bank_transfer', paymentStatus: 'Paid',
      status: 'Processing', notes: 'Weekly restaurant order - need by Friday'
    });

    const order4 = await Order.create({
      customer: retailer1._id,
      items: [
        { product: inv1._id, productName: 'Whole Chicken', quantity: 50, unit: 'pieces', pricePerUnit: 120, total: 6000 },
        { product: inv3._id, productName: 'Chicken Thighs', quantity: 30, unit: 'pieces', pricePerUnit: 75, total: 2250 },
        { product: inv6._id, productName: 'Eggs (30 pack)', quantity: 40, unit: 'packs', pricePerUnit: 95, total: 3800 }
      ],
      subtotal: 12050, tax: 1807.50, shippingCost: 0, total: 13857.50,
      deliveryOption: 'farm_gate', paymentMethod: 'bank_transfer', paymentStatus: 'Paid',
      status: 'Confirmed', notes: 'Bulk order for supermarket chain'
    });

    const order5 = await Order.create({
      customer: institution1._id,
      items: [
        { product: inv1._id, productName: 'Whole Chicken', quantity: 15, unit: 'pieces', pricePerUnit: 120, total: 1800 },
        { product: inv6._id, productName: 'Eggs (30 pack)', quantity: 10, unit: 'packs', pricePerUnit: 95, total: 950 }
      ],
      subtotal: 2750, tax: 412.50, shippingCost: 50, total: 3212.50,
      deliveryOption: 'local_delivery', deliveryAddress: '15 Education Drive, Bloemfontein, 9300',
      paymentMethod: 'bank_transfer', paymentStatus: 'Pending',
      status: 'Pending', notes: 'School catering order - monthly'
    });

    const order6 = await Order.create({
      customer: consumer1._id,
      items: [
        { product: inv4._id, productName: 'Chicken Wings', quantity: 10, unit: 'pieces', pricePerUnit: 65, total: 650 }
      ],
      subtotal: 650, tax: 97.50, shippingCost: 50, total: 797.50,
      deliveryOption: 'local_delivery', deliveryAddress: '101 Main Street, Johannesburg, 2000',
      paymentMethod: 'credit_card', paymentStatus: 'Refunded',
      status: 'Cancelled', cancellationReason: 'Customer changed mind - found cheaper elsewhere',
      refundAmount: 797.50, notes: 'Cancelled within 24 hours'
    });

    const order7 = await Order.create({
      customer: consumer2._id,
      items: [
        { product: inv2._id, productName: 'Chicken Breast', quantity: 5, unit: 'pieces', pricePerUnit: 85, total: 425 },
        { product: inv5._id, productName: 'Chicken Livers', quantity: 2, unit: 'packs', pricePerUnit: 45, total: 90 }
      ],
      subtotal: 515, tax: 77.25, shippingCost: 0, total: 592.25,
      deliveryOption: 'pickup', paymentMethod: 'cash', paymentStatus: 'Paid',
      status: 'Delivered', notes: 'Pickup from farm'
    });

    console.log('Created 7 orders');

    // ========== FEEDBACK ==========
    console.log('Creating feedback records...');
    await Feedback.create({
      customerId: consumer1._id, userId: consumer1._id, customerName: 'Jane Smith',
      type: 'feedback', category: 'Product Quality', subject: 'Excellent chicken quality!',
      message: 'The whole chickens I received were fresh and well-packaged. Will definitely order again!',
      rating: 5, orderId: order1._id, status: 'Resolved',
      response: 'Thank you for your kind words, Jane! We take pride in our quality.',
      respondedBy: admin._id, respondedAt: new Date('2026-07-30'),
      resolvedAt: new Date('2026-07-30'), priority: 'Low'
    });

    await Feedback.create({
      customerId: consumer2._id, userId: consumer2._id, customerName: 'David Nkosi',
      type: 'complaint', category: 'Delivery', subject: 'Delivery was late',
      message: 'My order was supposed to arrive by 2pm but only came at 4pm. The eggs were slightly cracked.',
      rating: 2, orderId: order2._id, status: 'Responded',
      priority: 'High',
      response: 'We apologize for the delay, David. We are investigating the delivery issue and will compensate you for the damaged eggs.',
      respondedBy: admin._id, respondedAt: new Date('2026-07-16')
    });

    await Feedback.create({
      customerId: restaurant1._id, userId: restaurant1._id, customerName: 'Maria Garcia',
      type: 'suggestion', category: 'Products', subject: 'Request for bulk packaging',
      message: 'It would be great if you could offer bulk packaging options for restaurants. 50+ pieces in a single box.',
      status: 'Open', priority: 'Medium'
    });

    await Feedback.create({
      customerId: retailer1._id, userId: retailer1._id, customerName: 'Pieter Van Der Berg',
      type: 'inquiry', category: 'Wholesale', subject: 'Wholesale pricing inquiry',
      message: 'We are interested in establishing a regular wholesale supply agreement. What discounts are available for orders over 500 pieces?',
      status: 'Open', priority: 'Medium'
    });

    await Feedback.create({
      customerId: consumer1._id, userId: consumer1._id, customerName: 'Jane Smith',
      type: 'feedback', category: 'Service', subject: 'Great customer service',
      message: 'The farm staff were very helpful when I visited for pickup. Friendly and professional.',
      rating: 5, status: 'Resolved',
      response: 'Thank you, Jane! Our team works hard to provide excellent service.',
      respondedBy: admin._id, respondedAt: new Date('2026-08-01'),
      resolvedAt: new Date('2026-08-01'), priority: 'Low'
    });

    console.log('Created 5 feedback records');

    // ========== CAMPAIGNS ==========
    console.log('Creating promotional campaigns...');
    await Campaign.create({
      name: 'Winter Warmer Special',
      description: 'Get 15% off on all chicken products this winter!',
      type: 'discount', channel: 'email',
      subject: 'Stay Warm with Bohloko Farm - 15% Off!',
      content: 'Dear valued customer, enjoy 15% off all our fresh chicken products this winter. Use code WINTER15 at checkout.',
      targetAudience: 'all', discount: 15, discountType: 'percentage',
      startDate: new Date('2026-06-01'), endDate: new Date('2026-08-31'),
      status: 'Active', createdBy: admin._id,
      stats: { sent: 150, opened: 98, clicked: 45, converted: 22, revenue: 18500 }
    });

    await Campaign.create({
      name: 'New Customer Welcome',
      description: 'Special discount for new customers on their first order',
      type: 'promotion', channel: 'email',
      subject: 'Welcome to Bohloko Family Farm!',
      content: 'Welcome! Enjoy 10% off your first order. Use code WELCOME10 at checkout.',
      targetAudience: 'new_customers', discount: 10, discountType: 'percentage',
      startDate: new Date('2026-01-01'), status: 'Active', createdBy: admin._id,
      stats: { sent: 45, opened: 38, clicked: 20, converted: 12, revenue: 7200 }
    });

    await Campaign.create({
      name: 'Refer a Friend',
      description: 'Earn bonus points for every friend you refer',
      type: 'promotion', channel: 'both',
      subject: 'Refer Friends, Earn Rewards!',
      content: 'Share the love! Refer a friend and both of you earn 500 bonus loyalty points.',
      targetAudience: 'loyalty_members', discount: 0, discountType: 'percentage',
      startDate: new Date('2026-07-01'), endDate: new Date('2026-09-30'),
      status: 'Active', createdBy: admin._id,
      stats: { sent: 80, opened: 55, clicked: 30, converted: 15, revenue: 0 }
    });

    await Campaign.create({
      name: 'Easter Egg-stravaganza',
      description: 'Special Easter promotion on eggs and chicken',
      type: 'discount', channel: 'email',
      subject: 'Easter Specials at Bohloko Farm!',
      content: 'Celebrate Easter with fresh farm eggs and chicken. 20% off all egg products!',
      targetAudience: 'all', discount: 20, discountType: 'percentage',
      startDate: new Date('2026-04-01'), endDate: new Date('2026-04-20'),
      status: 'Completed', createdBy: admin._id,
      stats: { sent: 200, opened: 145, clicked: 78, converted: 40, revenue: 32000 }
    });

    console.log('Created 4 campaigns');

    // ========== CUSTOMER ENROLLMENTS ==========
    console.log('Creating loyalty enrollments...');
    await CustomerEnrollment.create({
      customerId: profile1._id, userId: consumer1._id, programId: loyaltyProgram._id
    });
    await CustomerEnrollment.create({
      customerId: profile2._id, userId: consumer2._id, programId: loyaltyProgram._id
    });
    await CustomerEnrollment.create({
      customerId: profile3._id, userId: restaurant1._id, programId: loyaltyProgram._id
    });
    await CustomerEnrollment.create({
      customerId: profile4._id, userId: retailer1._id, programId: loyaltyProgram._id
    });
    await CustomerEnrollment.create({
      customerId: profile5._id, userId: institution1._id, programId: loyaltyProgram._id
    });

    console.log('Created 5 loyalty enrollments');

    // ========== POINTS TRANSACTIONS ==========
    console.log('Creating points transactions...');
    await SystemConfig.initDefaults();

    console.log('\n========================================');
    console.log('SEED DATA CREATED SUCCESSFULLY!');
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
    console.log('Production Cycles:  4 (1 In Progress, 2 Completed, 1 Planned)');
    console.log('Daily Logs:         35 (current cycle)');
    console.log('Medications:        4');
    console.log('Health Checks:      5');
    console.log('Vaccinations:       5');
    console.log('Weight Records:     5');
    console.log('Feed Records:       13');
    console.log('Environment Recs:   35');
    console.log('Inventory Items:    8 (6 available, 1 sold, 1 expired)');
    console.log('Orders:             7 (various statuses)');
    console.log('Customer Profiles:  5');
    console.log('Loyalty Enrollments: 5');
    console.log('Feedback:           5');
    console.log('Campaigns:          4');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
