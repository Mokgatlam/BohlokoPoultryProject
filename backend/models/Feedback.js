const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Feedback {
  static async create(data) {
    const feedback = {
      _id: uuidv4(),
      customerId: data.customerId,
      userId: data.userId,
      customerName: data.customerName || 'Anonymous',
      type: data.type,
      category: data.category || 'General',
      subject: data.subject,
      message: data.message,
      rating: data.rating || null,
      orderId: data.orderId || null,
      status: 'Open',
      priority: data.priority || 'Medium',
      response: null,
      respondedBy: null,
      respondedAt: null,
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.feedbackComplaints.insert(feedback);
    return feedback;
  }

  static async find(query = {}) {
    return await db.feedbackComplaints.find(query).sort({ createdAt: -1 }).exec();
  }

  static async findById(id) {
    return await db.feedbackComplaints.findOne({ _id: id });
  }

  static async update(id, updates) {
    updates.updatedAt = new Date();
    await db.feedbackComplaints.update({ _id: id }, { $set: updates });
    return await db.feedbackComplaints.findOne({ _id: id });
  }

  static async respond(id, response, respondedBy) {
    return await this.update(id, {
      response,
      respondedBy,
      respondedAt: new Date(),
      status: 'Responded'
    });
  }

  static async resolve(id) {
    return await this.update(id, {
      status: 'Resolved',
      resolvedAt: new Date()
    });
  }

  static async getStatistics() {
    const all = await db.feedbackComplaints.find({});
    return {
      total: all.length,
      open: all.filter(f => f.status === 'Open').length,
      responded: all.filter(f => f.status === 'Responded').length,
      resolved: all.filter(f => f.status === 'Resolved').length,
      byType: {
        feedback: all.filter(f => f.type === 'feedback').length,
        complaint: all.filter(f => f.type === 'complaint').length,
        suggestion: all.filter(f => f.type === 'suggestion').length,
        inquiry: all.filter(f => f.type === 'inquiry').length
      },
      byPriority: {
        low: all.filter(f => f.priority === 'Low').length,
        medium: all.filter(f => f.priority === 'Medium').length,
        high: all.filter(f => f.priority === 'High').length,
        urgent: all.filter(f => f.priority === 'Urgent').length
      },
      averageRating: all.filter(f => f.rating).reduce((sum, f, _, arr) => sum + f.rating / arr.length, 0)
    };
  }
}

module.exports = Feedback;
