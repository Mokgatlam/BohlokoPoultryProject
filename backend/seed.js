const User = require('./models/User');
const SystemConfig = require('./models/SystemConfig');

const seedDB = async () => {
  try {
    await User.deleteMany({});

    await User.create({
      firstName: 'Admin', lastName: 'Manager', email: 'admin@bohlokofarm.co.za',
      password: 'Admin@123', userType: 'Staff', role: 'Farm Manager', status: 'approved', phone: '+27511234567'
    });

    await User.create({
      firstName: 'John', lastName: 'Doe', email: 'john@bohlokofarm.co.za',
      password: 'Staff@123', userType: 'Staff', role: 'Poultry Attendant', status: 'approved', phone: '+27511234568'
    });

    await User.create({
      firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com',
      password: 'Consumer@123', userType: 'Consumer', role: 'Customer', status: 'pending', phone: '+27511234569'
    });

    await SystemConfig.initDefaults();

    console.log('Seed data created successfully');
    console.log('Admin: admin@bohlokofarm.co.za / Admin@123');
    console.log('Staff: john@bohlokofarm.co.za / Staff@123');
    console.log('Consumer (pending): jane@example.com / Consumer@123');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
