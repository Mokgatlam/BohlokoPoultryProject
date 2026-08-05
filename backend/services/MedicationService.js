const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class MedicationService {
  constructor() {
    this.repo = new BaseRepository(db.medications);
  }

  async create(data, userId) {
    return await this.repo.create({
      ...data,
      administeredBy: userId,
      status: data.status || 'Active'
    });
  }

  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.cycle) query.cycle = filters.cycle;
    if (filters.medicationType) query.medicationType = filters.medicationType;
    return await this.repo.find(query);
  }

  async getById(id) {
    return await this.repo.findById(id);
  }

  async getByCycle(cycleId) {
    return await this.repo.find({ cycle: cycleId });
  }

  async getActive() {
    return await this.repo.find({ status: 'Active' });
  }

  async getExpiring(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const all = await this.repo.find({ status: 'Active' });
    return all.filter(m => m.expiryDate && new Date(m.expiryDate) <= futureDate);
  }

  async update(id, data) {
    return await this.repo.findByIdAndUpdate(id, data);
  }

  async complete(id) {
    return await this.repo.findByIdAndUpdate(id, {
      status: 'Completed',
      completedAt: new Date()
    });
  }

  async cancel(id, reason) {
    return await this.repo.findByIdAndUpdate(id, {
      status: 'Cancelled',
      cancellationReason: reason,
      cancelledAt: new Date()
    });
  }

  async count() {
    return await this.repo.count();
  }
}

module.exports = new MedicationService();
