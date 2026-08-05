const CustomerProfile = require('../models/CustomerProfile');
const { LoyaltyProgram, PointsTransaction, CustomerEnrollment } = require('../models/Loyalty');
const Feedback = require('../models/Feedback');
const Campaign = require('../models/Campaign');

// Static reward catalog
const REWARD_CATALOG = [
  { id: 1, name: '5% Discount', points: 500, description: 'Get 5% off your next order' },
  { id: 2, name: '10% Discount', points: 1000, description: 'Get 10% off your next order' },
  { id: 3, name: 'Free Delivery', points: 300, description: 'Free delivery on your next order' },
  { id: 4, name: 'Free Chicken (1kg)', points: 2000, description: 'Get a free whole chicken' },
  { id: 5, name: 'R100 Voucher', points: 1500, description: 'R100 off your next order' }
];

class CrmService {
  // ---- Customer Profiles ----

  async getMyProfile(user) {
    let profile = await CustomerProfile.findByUserId(user._id);
    if (!profile) {
      profile = await CustomerProfile.create({
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        userType: user.userType
      });
    }
    return profile;
  }

  async getProfileById(id) {
    const profile = await CustomerProfile.findById(id);
    if (!profile) throw new Error('Profile not found');
    return profile;
  }

  async updateProfile(id, data, user) {
    const profile = await CustomerProfile.findById(id);
    if (!profile) throw new Error('Profile not found');

    if (profile.userId && profile.userId.toString() !== user._id.toString() && user.role !== 'Farm Manager') {
      throw new Error('Not authorized');
    }

    const allowedFields = ['firstName', 'lastName', 'phone', 'email', 'address', 'businessName', 'preferences'];
    const filtered = {};
    allowedFields.forEach(f => { if (data[f] !== undefined) filtered[f] = data[f]; });

    return await CustomerProfile.update(id, filtered);
  }

  async searchCustomers(q) {
    if (!q) return [];
    return await CustomerProfile.search(q);
  }

  async getAllCustomers() {
    return await CustomerProfile.find();
  }

  async segmentCustomers(criteria) {
    return await CustomerProfile.segment(criteria);
  }

  async exportCustomersCsv() {
    const customers = await CustomerProfile.find();
    const csv = 'Name,Email,Phone,Type,Tier,Total Orders,Total Spent,Segment\n' +
      customers.map(c =>
        `${c.firstName} ${c.lastName},${c.email},${c.phone},${c.userType},${c.loyalty?.tier || ''},${c.stats?.totalOrders || 0},${c.stats?.totalSpent || 0},${c.segment || ''}`
      ).join('\n');
    return csv;
  }

  // ---- Loyalty ----

  async enrollLoyalty(user) {
    const existing = await CustomerEnrollment.findByUser(user._id);
    if (existing) throw new Error('Already enrolled');

    const program = await LoyaltyProgram.getDefault();
    const profile = await CustomerProfile.findByUserId(user._id);

    const enrollment = await CustomerEnrollment.create({
      customerId: profile?._id,
      userId: user._id,
      programId: program._id
    });

    if (profile) {
      await CustomerProfile.update(profile._id, {
        'loyalty.programId': program._id,
        'loyalty.enrolledAt': new Date()
      });
    }

    return enrollment;
  }

  async getAvailableRewards(user) {
    const profile = await CustomerProfile.findByUserId(user._id);
    const points = profile?.loyalty?.points || 0;
    const available = REWARD_CATALOG.filter(r => points >= r.points);
    return { points, rewards: REWARD_CATALOG, available };
  }

  async getLoyaltyTransactions(userId) {
    return await PointsTransaction.findByCustomer(userId);
  }

  // ---- Feedback ----

  async createFeedback(data, user) {
    return await Feedback.create({
      ...data,
      customerId: user._id,
      userId: user._id,
      customerName: `${user.firstName} ${user.lastName}`
    });
  }

  async getFeedback(query = {}) {
    const { status, type } = query;
    const dbQuery = {};
    if (status) dbQuery.status = status;
    if (type) dbQuery.type = type;
    return await Feedback.find(dbQuery);
  }

  async getFeedbackStatistics() {
    return await Feedback.getStatistics();
  }

  async respondToFeedback(id, response, userId) {
    return await Feedback.respond(id, response, userId);
  }

  async resolveFeedback(id) {
    return await Feedback.resolve(id);
  }

  // ---- Campaigns ----

  async createCampaign(data, user) {
    return await Campaign.create({ ...data, createdBy: user._id });
  }

  async getCampaigns() {
    return await Campaign.find();
  }

  async getCampaignPerformance(id) {
    const performance = await Campaign.getPerformance(id);
    if (!performance) throw new Error('Campaign not found');
    return performance;
  }

  async activateCampaign(id) {
    return await Campaign.activate(id);
  }

  async pauseCampaign(id) {
    return await Campaign.pause(id);
  }

  // ---- Dashboard ----

  async getDashboardStats() {
    const customers = await CustomerProfile.find();
    const feedbackStats = await Feedback.getStatistics();
    const campaignStats = await Campaign.getAllStats();

    return {
      totalCustomers: customers.length,
      newCustomers: customers.filter(c => c.segment === 'New').length,
      returningCustomers: customers.filter(c => c.segment === 'Returning').length,
      vipCustomers: customers.filter(c => c.segment === 'VIP').length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.stats?.totalSpent || 0), 0),
      averageLifetimeValue: customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.lifetimeValue?.predicted || 0), 0) / customers.length
        : 0,
      loyaltyDistribution: {
        Bronze: customers.filter(c => c.loyalty?.tier === 'Bronze').length,
        Silver: customers.filter(c => c.loyalty?.tier === 'Silver').length,
        Gold: customers.filter(c => c.loyalty?.tier === 'Gold').length,
        Platinum: customers.filter(c => c.loyalty?.tier === 'Platinum').length,
        Diamond: customers.filter(c => c.loyalty?.tier === 'Diamond').length
      },
      feedback: feedbackStats,
      campaigns: campaignStats
    };
  }

  // ---- CLV ----

  async calculateCLV(id) {
    const clv = await CustomerProfile.calculateCLV(id);
    if (!clv) throw new Error('Customer not found');
    return clv;
  }
}

module.exports = new CrmService();