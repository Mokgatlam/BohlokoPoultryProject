const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class NotificationService {
  constructor() {
    this.repo = new BaseRepository(db.notifications);
  }

  async create(data) {
    return await this.repo.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      priority: data.priority || 'normal',
      actionUrl: data.actionUrl || null,
      expiresAt: data.expiresAt || null
    });
  }

  async getByUser(userId, options = {}) {
    const query = { userId };
    if (options.unreadOnly) query.read = false;
    if (options.type) query.type = options.type;
    return await this.repo.find(query);
  }

  async getById(id) {
    return await this.repo.findById(id);
  }

  async markAsRead(id) {
    return await this.repo.findByIdAndUpdate(id, { read: true, readAt: new Date() });
  }

  async markAllAsRead(userId) {
    const notifications = await this.repo.find({ userId, read: false });
    for (const n of notifications) {
      await this.repo.findByIdAndUpdate(n._id, { read: true, readAt: new Date() });
    }
  }

  async getUnreadCount(userId) {
    return await this.repo.count({ userId, read: false });
  }

  async delete(id) {
    return await this.repo.findByIdAndUpdate(id, { deleted: true });
  }

  async deleteAll(userId) {
    const notifications = await this.repo.find({ userId });
    for (const n of notifications) {
      await this.repo.findByIdAndUpdate(n._id, { deleted: true });
    }
  }

  async getRecent(limit = 10) {
    return await this.repo.find({}).then(n => n.slice(0, limit));
  }

  async count() {
    return await this.repo.count();
  }
}

module.exports = new NotificationService();
