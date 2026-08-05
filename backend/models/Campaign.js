const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Campaign {
  static async create(data) {
    const campaign = {
      _id: uuidv4(),
      name: data.name,
      description: data.description || '',
      type: data.type,
      channel: data.channel,
      subject: data.subject || '',
      content: data.content || '',
      targetAudience: data.targetAudience || 'all',
      targetCriteria: data.targetCriteria || {},
      discount: data.discount || 0,
      discountType: data.discountType || 'percentage',
      startDate: data.startDate || new Date(),
      endDate: data.endDate || null,
      status: 'Draft',
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        revenue: 0
      },
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.promotionalCampaigns.insert(campaign);
    return campaign;
  }

  static async find(query = {}) {
    return await db.promotionalCampaigns.find(query).sort({ createdAt: -1 }).exec();
  }

  static async findById(id) {
    return await db.promotionalCampaigns.findOne({ _id: id });
  }

  static async update(id, updates) {
    updates.updatedAt = new Date();
    await db.promotionalCampaigns.update({ _id: id }, { $set: updates });
    return await db.promotionalCampaigns.findOne({ _id: id });
  }

  static async activate(id) {
    return await this.update(id, { status: 'Active', startDate: new Date() });
  }

  static async pause(id) {
    return await this.update(id, { status: 'Paused' });
  }

  static async getPerformance(id) {
    const campaign = await this.findById(id);
    if (!campaign) return null;
    return {
      ...campaign.stats,
      conversionRate: campaign.stats.sent > 0 ? ((campaign.stats.converted / campaign.stats.sent) * 100).toFixed(2) : 0,
      roi: campaign.stats.revenue > 0 ? ((campaign.stats.revenue - (campaign.discount || 0)) / (campaign.discount || 1) * 100).toFixed(2) : 0
    };
  }

  static async getAllStats() {
    const all = await db.promotionalCampaigns.find({});
    return {
      total: all.length,
      active: all.filter(c => c.status === 'Active').length,
      draft: all.filter(c => c.status === 'Draft').length,
      completed: all.filter(c => c.status === 'Completed').length,
      totalSent: all.reduce((sum, c) => sum + (c.stats?.sent || 0), 0),
      totalConverted: all.reduce((sum, c) => sum + (c.stats?.converted || 0), 0),
      totalRevenue: all.reduce((sum, c) => sum + (c.stats?.revenue || 0), 0)
    };
  }
}

module.exports = Campaign;
