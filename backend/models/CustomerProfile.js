const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class CustomerProfile {
  static async create(data) {
    const profile = {
      _id: uuidv4(),
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
      userType: data.userType || 'Consumer',
      address: data.address || {},
      preferences: {
        communication: data.communication || 'email',
        newsletter: data.newsletter !== false,
        promotions: data.promotions !== false
      },
      stats: {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        lastOrderDate: null,
        firstOrderDate: null,
        orderFrequency: 0
      },
      loyalty: {
        tier: 'Bronze',
        points: 0,
        programId: null,
        enrolledAt: null
      },
      lifetimeValue: {
        historical: 0,
        predicted: 0,
        retentionProbability: 0.5
      },
      segment: 'New',
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.customerProfiles.insert(profile);
    return profile;
  }

  static async findById(id) {
    return await db.customerProfiles.findOne({ _id: id });
  }

  static async findByUserId(userId) {
    return await db.customerProfiles.findOne({ userId });
  }

  static async find(query = {}) {
    return await db.customerProfiles.find(query).sort({ createdAt: -1 }).exec();
  }

  static async update(id, updates) {
    updates.updatedAt = new Date();
    await db.customerProfiles.update({ _id: id }, { $set: updates });
    return await db.customerProfiles.findOne({ _id: id });
  }

  static async search(searchTerm) {
    const regex = new RegExp(searchTerm, 'i');
    return await db.customerProfiles.find({
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex }
      ]
    }).exec();
  }

  static async segment(criteria) {
    const all = await db.customerProfiles.find({});
    return all.filter(profile => {
      if (criteria.minOrders && profile.stats.totalOrders < criteria.minOrders) return false;
      if (criteria.maxOrders && profile.stats.totalOrders > criteria.maxOrders) return false;
      if (criteria.minSpent && profile.stats.totalSpent < criteria.minSpent) return false;
      if (criteria.tier && profile.loyalty.tier !== criteria.tier) return false;
      if (criteria.userType && profile.userType !== criteria.userType) return false;
      return true;
    });
  }

  static async calculateCLV(id) {
    const profile = await this.findById(id);
    if (!profile) return null;

    const stats = profile.stats;
    const avgOrderValue = stats.averageOrderValue || 0;
    const orderFrequency = stats.totalOrders || 0;
    const customerLifespan = 2.5;
    const clv = avgOrderValue * orderFrequency * customerLifespan;
    const retention = Math.min(0.95, 0.3 + (orderFrequency * 0.05));

    await this.update(id, {
      'lifetimeValue.historical': stats.totalSpent,
      'lifetimeValue.predicted': clv,
      'lifetimeValue.retentionProbability': retention
    });

    return { historical: stats.totalSpent, predicted: clv, retentionProbability: retention };
  }
}

module.exports = CustomerProfile;
