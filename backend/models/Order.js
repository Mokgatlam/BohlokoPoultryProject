const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Order {
  static async create(data) {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const order = { 
      _id: uuidv4(), 
      orderNumber, 
      ...data, 
      status: data.status || 'Pending',
      paymentStatus: data.paymentStatus || 'Pending',
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    await db.orders.insert(order);
    return order;
  }

  static async find(query = {}) {
    return await db.orders.find(query).sort({ createdAt: -1 }).exec();
  }

  static async findById(id) {
    return await db.orders.findOne({ _id: id });
  }

  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.orders.update({ _id: id }, { $set: updates });
    return await db.orders.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.orders.count(query);
  }
}

module.exports = Order;
