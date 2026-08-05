const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class ProductionCycle {
  static async create(data) {
    const cycle = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.productionCycles.insert(cycle);
    return cycle;
  }

  static async find(query = {}) {
    return await db.productionCycles.find(query).sort({ createdAt: -1 }).exec();
  }

  static async findById(id) {
    return await db.productionCycles.findOne({ _id: id });
  }

  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.productionCycles.update({ _id: id }, { $set: updates });
    return await db.productionCycles.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.productionCycles.count(query);
  }
}

class DailyLog {
  static async create(data) {
    const log = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.dailyLogs.insert(log);
    return log;
  }

  static async find(query = {}) {
    return await db.dailyLogs.find(query).sort({ date: -1 }).exec();
  }

  static async findById(id) {
    return await db.dailyLogs.findOne({ _id: id });
  }

  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.dailyLogs.update({ _id: id }, { $set: updates });
    return await db.dailyLogs.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.dailyLogs.count(query);
  }
}

class Medication {
  static async create(data) {
    const med = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.medications.insert(med);
    return med;
  }

  static async find(query = {}) {
    return await db.medications.find(query).sort({ date: -1 }).exec();
  }

  static async findById(id) {
    return await db.medications.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.medications.count(query);
  }
}

class HealthCheck {
  static async create(data) {
    const check = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.healthChecks.insert(check);
    return check;
  }

  static async find(query = {}) {
    return await db.healthChecks.find(query).sort({ date: -1 }).exec();
  }

  static async findById(id) {
    return await db.healthChecks.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.healthChecks.count(query);
  }
}

class Vaccination {
  static async create(data) {
    const vacc = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.vaccinations.insert(vacc);
    return vacc;
  }

  static async find(query = {}) {
    return await db.vaccinations.find(query).sort({ scheduledDate: -1 }).exec();
  }

  static async findById(id) {
    return await db.vaccinations.findOne({ _id: id });
  }

  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.vaccinations.update({ _id: id }, { $set: updates });
    return await db.vaccinations.findOne({ _id: id });
  }

  static async count(query = {}) {
    return await db.vaccinations.count(query);
  }
}

class WeightRecord {
  static async create(data) {
    const record = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.weightRecords.insert(record);
    return record;
  }

  static async find(query = {}) {
    return await db.weightRecords.find(query).sort({ date: -1 }).exec();
  }

  static async count(query = {}) {
    return await db.weightRecords.count(query);
  }
}

class FeedRecord {
  static async create(data) {
    const record = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.feedRecords.insert(record);
    return record;
  }

  static async find(query = {}) {
    return await db.feedRecords.find(query).sort({ date: -1 }).exec();
  }

  static async count(query = {}) {
    return await db.feedRecords.count(query);
  }
}

class EnvironmentRecord {
  static async create(data) {
    const record = { _id: uuidv4(), ...data, createdAt: new Date(), updatedAt: new Date() };
    await db.environmentRecords.insert(record);
    return record;
  }

  static async find(query = {}) {
    return await db.environmentRecords.find(query).sort({ date: -1 }).exec();
  }

  static async count(query = {}) {
    return await db.environmentRecords.count(query);
  }
}

module.exports = { 
  ProductionCycle, DailyLog, Medication, HealthCheck, 
  Vaccination, WeightRecord, FeedRecord, EnvironmentRecord 
};
