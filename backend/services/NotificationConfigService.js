const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class NotificationConfigService {
  constructor() {
    this.repo = new BaseRepository(db.notificationConfigs);
  }

  async create(data, userId) {
    return await this.repo.create({
      type: data.type,
      name: data.name,
      description: data.description || '',
      enabled: data.enabled !== false,
      channels: data.channels || { email: true, sms: false, push: true, inApp: true },
      recipients: data.recipients || { roles: [], users: [] },
      template: data.template || '',
      subject: data.subject || '',
      schedule: data.schedule || null,
      conditions: data.conditions || {},
      rateLimit: data.rateLimit || { maxPerHour: 10, maxPerDay: 50 },
      priority: data.priority || 'normal',
      metadata: data.metadata || {},
      createdBy: userId
    });
  }

  async getAll(filters = {}) {
    const query = {};
    if (filters.type) query.type = filters.type;
    if (filters.enabled !== undefined) query.enabled = filters.enabled;
    return await this.repo.find(query);
  }

  async getById(id) {
    return await this.repo.findById(id);
  }

  async getByType(type) {
    return await this.repo.findOne({ type });
  }

  async update(id, data) {
    return await this.repo.findByIdAndUpdate(id, data);
  }

  async toggle(id) {
    const config = await this.repo.findById(id);
    if (!config) throw new Error('Config not found');
    return await this.repo.findByIdAndUpdate(id, { enabled: !config.enabled });
  }

  async delete(id) {
    await this.repo.collection.remove({ _id: id });
  }

  async count() {
    return await this.repo.count();
  }
}

module.exports = new NotificationConfigService();
