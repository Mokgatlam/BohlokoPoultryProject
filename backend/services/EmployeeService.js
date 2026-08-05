const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class EmployeeService {
  constructor() {
    this.repo = new BaseRepository(db.employees);
  }

  async create(data, userId) {
    const employeeId = `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    return await this.repo.create({ ...data, employeeId, createdBy: userId });
  }

  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.department) query.department = filters.department;
    if (filters.search) {
      const safe = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { firstName: new RegExp(safe, 'i') },
        { lastName: new RegExp(safe, 'i') },
        { email: new RegExp(safe, 'i') },
        { employeeId: new RegExp(safe, 'i') }
      ];
    }
    return await this.repo.find(query);
  }

  async getById(id) {
    return await this.repo.findById(id);
  }

  async getByUserId(userId) {
    return await this.repo.findOne({ userId });
  }

  async update(id, data) {
    return await this.repo.findByIdAndUpdate(id, data);
  }

  async updateStatus(id, status) {
    return await this.repo.findByIdAndUpdate(id, { status });
  }

  async getDepartments() {
    const employees = await this.repo.find({});
    const departments = [...new Set(employees.map(e => e.department))];
    return departments;
  }

  async getStats() {
    const all = await this.repo.find({});
    const active = all.filter(e => e.status === 'active');
    const byDepartment = all.reduce((acc, e) => {
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {});
    return {
      total: all.length,
      active: active.length,
      inactive: all.filter(e => e.status !== 'active').length,
      byDepartment
    };
  }

  async count() {
    return await this.repo.count();
  }
}

module.exports = new EmployeeService();
