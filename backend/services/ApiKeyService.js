const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');
const crypto = require('crypto');

class ApiKeyService {
  constructor() {
    this.repo = new BaseRepository(db.apiKeys);
  }

  async create(data, userId) {
    const key = crypto.randomBytes(32).toString('hex');
    return await this.repo.create({
      key,
      name: data.name,
      description: data.description || '',
      userId,
      permissions: data.permissions || ['read'],
      status: 'active',
      rateLimit: data.rateLimit || 1000,
      usageCount: 0,
      lastUsedAt: null,
      expiresAt: data.expiresAt || null,
      allowedOrigins: data.allowedOrigins || ['*'],
      allowedIPs: data.allowedIPs || [],
      metadata: data.metadata || {},
      createdBy: userId
    });
  }

  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.userId) query.userId = filters.userId;
    return await this.repo.find(query);
  }

  async getById(id) {
    return await this.repo.findById(id);
  }

  async getByKey(key) {
    return await this.repo.findOne({ key });
  }

  async getByUser(userId) {
    return await this.repo.find({ userId });
  }

  async update(id, data) {
    return await this.repo.findByIdAndUpdate(id, data);
  }

  async revoke(id) {
    return await this.repo.findByIdAndUpdate(id, { status: 'revoked' });
  }

  async activate(id) {
    return await this.repo.findByIdAndUpdate(id, { status: 'active' });
  }

  async incrementUsage(id) {
    await this.repo.collection.update({ _id: id }, {
      $set: { lastUsedAt: new Date() },
      $inc: { usageCount: 1 }
    });
  }

  async delete(id) {
    await this.repo.collection.remove({ _id: id });
  }

  async count() {
    return await this.repo.count();
  }
}

module.exports = new ApiKeyService();
