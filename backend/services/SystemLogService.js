const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class SystemLogService {
  constructor() {
    this.repo = new BaseRepository(db.systemLogs);
  }

  async create(data) {
    return await this.repo.create({
      level: data.level || 'info',
      message: data.message,
      category: data.category || 'system',
      userId: data.userId || null,
      userName: data.userName || null,
      action: data.action || null,
      resource: data.resource || null,
      resourceId: data.resourceId || null,
      details: data.details || {},
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      method: data.method || null,
      path: data.path || null,
      statusCode: data.statusCode || null,
      responseTime: data.responseTime || null,
      error: data.error || null,
      stack: data.stack || null,
      timestamp: new Date()
    });
  }

  async getAll(filters = {}) {
    const query = {};
    if (filters.level) query.level = filters.level;
    if (filters.category) query.category = filters.category;
    if (filters.userId) query.userId = filters.userId;
    if (filters.startDate && filters.endDate) {
      query.timestamp = { $gte: new Date(filters.startDate), $lte: new Date(filters.endDate) };
    }
    return await this.repo.find(query);
  }

  async getById(id) {
    return await this.repo.findById(id);
  }

  async getByLevel(level) {
    return await this.repo.find({ level });
  }

  async getByUser(userId) {
    return await this.repo.find({ userId });
  }

  async getByCategory(category) {
    return await this.repo.find({ category });
  }

  async getRecent(limit = 100) {
    const all = await this.repo.find({});
    return all.slice(0, limit);
  }

  async getErrors(limit = 50) {
    const all = await this.repo.find({ level: 'error' });
    return all.slice(0, limit);
  }

  async clearOldLogs(days = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const old = await this.repo.find({ timestamp: { $lt: cutoff } });
    for (const log of old) {
      await this.repo.collection.remove({ _id: log._id });
    }
    return old.length;
  }

  async count() {
    return await this.repo.count();
  }
}

module.exports = new SystemLogService();
