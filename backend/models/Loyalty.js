const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class LoyaltyProgram {
  static async create(data) {
    const program = {
      _id: uuidv4(),
      name: data.name,
      description: data.description || '',
      tiers: data.tiers || [
        { name: 'Bronze', minPoints: 0, discount: 0 },
        { name: 'Silver', minPoints: 1000, discount: 5 },
        { name: 'Gold', minPoints: 2500, discount: 10 },
        { name: 'Platinum', minPoints: 5000, discount: 15 },
        { name: 'Diamond', minPoints: 10000, discount: 20 }
      ],
      pointsPerRand: data.pointsPerRand || 0.1,
      rewards: data.rewards || [],
      active: true,
      createdAt: new Date()
    };
    await db.loyaltyPrograms.insert(program);
    return program;
  }

  static async getDefault() {
    let program = await db.loyaltyPrograms.findOne({ active: true });
    if (!program) {
      program = await this.create({ name: 'Bohloko Rewards', description: 'Earn points with every purchase' });
    }
    return program;
  }
}

class PointsTransaction {
  static async findByCustomer(userId) {
    return await db.pointsTransactions.find({ userId }).sort({ createdAt: -1 }).exec();
  }
}

class CustomerEnrollment {
  static async create(data) {
    const enrollment = {
      _id: uuidv4(),
      customerId: data.customerId,
      userId: data.userId,
      programId: data.programId,
      tier: 'Bronze',
      points: 0,
      enrolledAt: new Date(),
      active: true
    };
    await db.customerEnrollments.insert(enrollment);
    return enrollment;
  }

  static async findByUser(userId) {
    return await db.customerEnrollments.findOne({ userId, active: true });
  }
}

module.exports = { LoyaltyProgram, PointsTransaction, CustomerEnrollment };
