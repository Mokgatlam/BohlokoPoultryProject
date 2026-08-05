const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class ProductionService {
  constructor() {
    this.cycleRepo = new BaseRepository(db.productionCycles);
    this.dailyLogRepo = new BaseRepository(db.dailyLogs);
    this.medicationRepo = new BaseRepository(db.medications);
    this.healthCheckRepo = new BaseRepository(db.healthChecks);
    this.vaccinationRepo = new BaseRepository(db.vaccinations);
    this.weightRecordRepo = new BaseRepository(db.weightRecords);
    this.feedRecordRepo = new BaseRepository(db.feedRecords);
    this.environmentRecordRepo = new BaseRepository(db.environmentRecords);
  }

  async createCycle(data, userId) {
    return await this.cycleRepo.create({ ...data, createdBy: userId });
  }

  async getCycles() {
    return await this.cycleRepo.find({});
  }

  async getCycleById(id) {
    return await this.cycleRepo.findById(id);
  }

  async updateCycle(id, data) {
    return await this.cycleRepo.findByIdAndUpdate(id, data);
  }

  async approveCycle(id, userId) {
    return await this.cycleRepo.findByIdAndUpdate(id, {
      status: 'Approved', approvedBy: userId, approvedAt: new Date()
    });
  }

  async createDailyLog(data, userId) {
    const { birdCount, mortality } = data;
    const rate = mortality?.count ? (mortality.count / birdCount) * 100 : 0;
    if (rate > 5) console.log(`ALERT: High mortality rate: ${rate.toFixed(2)}%`);
    return await this.dailyLogRepo.create({ ...data, mortality: { ...mortality, rate }, recordedBy: userId });
  }

  async getDailyLogs(cycleId) {
    return await this.dailyLogRepo.find({ cycle: cycleId });
  }

  async createMedication(data, userId) {
    return await this.medicationRepo.create({ ...data, administeredBy: userId });
  }

  async getMedications(cycleId) {
    return await this.medicationRepo.find({ cycle: cycleId });
  }

  async createHealthCheck(data, userId) {
    return await this.healthCheckRepo.create({ ...data, inspectedBy: userId });
  }

  async getHealthChecks(cycleId) {
    return await this.healthCheckRepo.find({ cycle: cycleId });
  }

  async createVaccination(data, userId) {
    return await this.vaccinationRepo.create({ ...data, createdBy: userId });
  }

  async getVaccinations(cycleId) {
    return await this.vaccinationRepo.find({ cycle: cycleId });
  }

  async completeVaccination(id, userId) {
    return await this.vaccinationRepo.findByIdAndUpdate(id, {
      status: 'Completed', completedDate: new Date(), completedBy: userId
    });
  }

  async createWeightRecord(data, userId) {
    return await this.weightRecordRepo.create({ ...data, recordedBy: userId });
  }

  async getWeightRecords(cycleId) {
    return await this.weightRecordRepo.find({ cycle: cycleId });
  }

  async createFeedRecord(data, userId) {
    return await this.feedRecordRepo.create({ ...data, recordedBy: userId });
  }

  async getFeedRecords(cycleId) {
    return await this.feedRecordRepo.find({ cycle: cycleId });
  }

  async createEnvironmentRecord(data, userId) {
    return await this.environmentRecordRepo.create({ ...data, recordedBy: userId });
  }

  async getEnvironmentRecords(cycleId) {
    return await this.environmentRecordRepo.find({ cycle: cycleId });
  }

  async getCareDashboard() {
    const cycles = await this.cycleRepo.find({});
    const activeCycles = cycles.filter(c => c.status === 'Active' || c.status === 'Approved');
    const totalBirds = activeCycles.reduce((sum, c) => sum + (c.actualBirds || c.expectedBirds || 0), 0);

    const today = new Date().toISOString().split('T')[0];
    const todayLogs = await this.dailyLogRepo.find({ date: today });
    const todayMortality = todayLogs.reduce((sum, l) => sum + (l.mortality?.count || 0), 0);

    const recentMeds = await this.medicationRepo.find({});
    const allVaccs = await this.vaccinationRepo.find({});
    const upcomingVaccs = allVaccs.filter(v => v.status !== 'Completed' && new Date(v.scheduledDate) >= new Date());
    const recentHealth = await this.healthCheckRepo.find({});

    return {
      activeCycles: activeCycles.length,
      totalBirds,
      todayMortality,
      mortalityRate: totalBirds > 0 ? ((todayMortality / totalBirds) * 100).toFixed(2) : 0,
      recentMedications: recentMeds.slice(0, 5),
      upcomingVaccinations: upcomingVaccs.slice(0, 5),
      recentHealthChecks: recentHealth.slice(0, 5)
    };
  }
}

module.exports = new ProductionService();
