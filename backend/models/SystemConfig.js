const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class SystemConfig {
  static async get(key) {
    const config = await db.systemConfig.findOne({ key });
    if (!config) return null;
    try { return JSON.parse(config.value); } catch { return config.value; }
  }

  static async set(key, value, updatedBy) {
    const jsonValue = JSON.stringify(value);
    const existing = await db.systemConfig.findOne({ key });
    if (existing) {
      await db.systemConfig.update({ key }, { $set: { value: jsonValue, updatedAt: new Date(), updatedBy } });
    } else {
      await db.systemConfig.insert({ _id: uuidv4(), key, value: jsonValue, createdAt: new Date(), updatedAt: new Date(), updatedBy });
    }
  }

  static async getAll() {
    const configs = await db.systemConfig.find({});
    const result = {};
    configs.forEach(c => {
      try { result[c.key] = JSON.parse(c.value); } catch { result[c.key] = c.value; }
    });
    return result;
  }

  static async initDefaults() {
    const defaults = {
      taxRate: 15,
      shippingLocal: 50,
      shippingThreshold: 1000,
      lowStockThreshold: 10,
      bulkDiscount5: 5,
      bulkDiscount10: 10,
      bulkDiscount15: 15,
      bulkThreshold1: 100,
      bulkThreshold2: 500,
      bulkThreshold3: 1000,
      currency: 'ZAR',
      currencySymbol: 'R',
      businessHours: { open: '06:00', close: '22:00' },
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      lockDuration: 30,
      passwordMinLength: 8,
      requireSpecialChar: true,
      requireUppercase: true,
      requireNumber: true
    };

    for (const [key, value] of Object.entries(defaults)) {
      const existing = await this.get(key);
      if (existing === null) {
        await this.set(key, value);
      }
    }
  }
}

module.exports = SystemConfig;
