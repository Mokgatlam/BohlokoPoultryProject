const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class UserService {
  constructor() {
    this.repo = new BaseRepository(db.users);
  }

  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  }

  async register(data) {
    const existing = await this.repo.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new Error('Email already registered');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await this.repo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      userType: data.userType,
      role: 'Customer',
      phone: data.phone || '',
      businessName: data.businessName || '',
      address: data.address || {},
      status: 'pending',
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLogin: null
    });

    const { password, failedLoginAttempts, lockUntil, lastLogin, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  }

  async login(email, password) {
    const user = await this.repo.findOne({ email: email.toLowerCase() });
    if (!user) throw new Error('Invalid email or password');

    if (user.lockUntil && user.lockUntil > Date.now()) {
      throw new Error('Account is temporarily locked due to multiple failed login attempts');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await this.incrementLoginAttempts(user._id, user);
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'approved') {
      const messages = {
        pending: 'Your account is pending approval by the Farm Manager',
        suspended: 'Your account has been suspended',
        rejected: 'Your account registration was rejected'
      };
      throw new Error(messages[user.status] || 'Account not active');
    }

    await this.repo.findByIdAndUpdate(user._id, { failedLoginAttempts: 0, lockUntil: null, lastLogin: new Date() });

    const token = this.generateToken(user._id);
    const { password: _, failedLoginAttempts, lockUntil, lastLogin, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async incrementLoginAttempts(userId, user) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    const updates = { failedLoginAttempts: attempts };
    if (attempts >= 5) {
      updates.lockUntil = Date.now() + 30 * 60 * 1000;
    }
    await this.repo.collection.update({ _id: userId }, { $set: updates });
  }

  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.userType) query.userType = filters.userType;
    if (filters.role) query.role = filters.role;
    if (filters.search) {
      const safe = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { firstName: new RegExp(safe, 'i') },
        { lastName: new RegExp(safe, 'i') },
        { email: new RegExp(safe, 'i') }
      ];
    }
    return await this.repo.find(query);
  }

  async getPending() {
    return await this.repo.find({ status: 'pending' });
  }

  async getStats() {
    const total = await this.repo.count();
    const pending = await this.repo.count({ status: 'pending' });
    const approved = await this.repo.count({ status: 'approved' });
    const suspended = await this.repo.count({ status: 'suspended' });
    const rejected = await this.repo.count({ status: 'rejected' });

    const byType = {};
    const byRole = {};
    const users = await this.repo.find({});
    users.forEach(u => {
      byType[u.userType] = (byType[u.userType] || 0) + 1;
      byRole[u.role] = (byRole[u.role] || 0) + 1;
    });

    return { total, pending, approved, suspended, rejected, byType, byRole };
  }

  async getById(id) {
    return await this.repo.findById(id);
  }

  async getByEmail(email) {
    return await this.repo.findOne({ email: email.toLowerCase() });
  }

  async resetPassword(userId, newPassword) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return await this.repo.findByIdAndUpdate(userId, { password: hashedPassword });
  }

  async create(data) {
    const existing = await this.repo.findOne({ email: data.email.toLowerCase() });
    if (existing) throw new Error('Email already registered');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    return await this.repo.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      userType: data.userType,
      role: data.role,
      phone: data.phone || '',
      businessName: data.businessName || '',
      status: 'approved'
    });
  }

  async updateStatus(id, status) {
    return await this.repo.findByIdAndUpdate(id, { status });
  }

  async updateRole(id, role) {
    return await this.repo.findByIdAndUpdate(id, { role });
  }

  async updateProfile(id, updates, requestor) {
    if (id !== requestor._id && requestor.role !== 'Farm Manager') {
      throw new Error('Not authorized');
    }
    const allowed = ['firstName', 'lastName', 'phone', 'address', 'businessName'];
    const filtered = {};
    allowed.forEach(f => { if (updates[f] !== undefined) filtered[f] = updates[f]; });
    return await this.repo.findByIdAndUpdate(id, filtered);
  }

  async bulkUpdateStatus(ids, status) {
    for (const id of ids) {
      await this.repo.findByIdAndUpdate(id, { status });
    }
    return `${ids.length} users updated to ${status}`;
  }

  async softDelete(id) {
    const user = await this.repo.findById(id);
    if (!user) throw new Error('User not found');
    if (user.role === 'Farm Manager') throw new Error('Cannot delete Farm Manager');
    return await this.repo.findByIdAndUpdate(id, { status: 'deleted' });
  }
}

module.exports = new UserService();
