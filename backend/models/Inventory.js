const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class Inventory {
  static async create(data) {
    const item = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.inventory.insert(item);
    return item;
  }

  static async find(query = {}) {
    return await db.inventory.find(query).sort({ harvestDate: -1 }).exec();
  }

  static async findById(id) {
    return await db.inventory.findOne({ _id: id });
  }

  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.inventory.update({ _id: id }, { $set: updates });
    return await db.inventory.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.inventory.count(query);
  }
}

module.exports = Inventory;
