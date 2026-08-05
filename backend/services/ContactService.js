const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class ContactService {
  constructor() {
    this.repo = new BaseRepository(db.contactMessages);
  }

  async createMessage(data) {
    const { name, email, subject, message, phone } = data;
    if (!name || !name.trim()) throw new Error('Name is required');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Valid email is required');
    if (!subject || !subject.trim()) throw new Error('Subject is required');
    if (!message || !message.trim()) throw new Error('Message is required');

    return await this.repo.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? String(phone).trim() : '',
      subject: subject.trim(),
      message: message.trim(),
      status: 'unread'
    });
  }

  async getAll(query = {}) {
    return await this.repo.find(query, { sort: { createdAt: -1 } });
  }

  async getById(id) {
    const message = await this.repo.findById(id);
    if (!message) throw new Error('Message not found');
    return message;
  }

  async updateStatus(id, status) {
    const valid = ['unread', 'read', 'responded', 'archived'];
    if (!valid.includes(status)) throw new Error('Invalid status');
    return await this.repo.findByIdAndUpdate(id, { status });
  }

  async delete(id) {
    const message = await this.repo.findById(id);
    if (!message) throw new Error('Message not found');
    await this.repo.deleteById(id);
    return { message: 'Message deleted' };
  }

  async getStatistics() {
    const all = await this.repo.find({});
    return {
      total: all.length,
      unread: all.filter(m => m.status === 'unread').length,
      read: all.filter(m => m.status === 'read').length,
      responded: all.filter(m => m.status === 'responded').length,
      archived: all.filter(m => m.status === 'archived').length
    };
  }
}

module.exports = new ContactService();