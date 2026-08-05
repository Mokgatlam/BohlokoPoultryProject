const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const user = {
      _id: uuidv4(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      userType: userData.userType,
      role: userData.role || 'Customer',
      phone: userData.phone || '',
      businessName: userData.businessName || '',
      businessRegNumber: userData.businessRegNumber || '',
      taxId: userData.taxId || '',
      address: userData.address || {},
      status: userData.status || 'pending',
      failedLoginAttempts: 0,
      lockUntil: null,
      lastLogin: null,
      lastLoginIP: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.users.insert(user);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async findOne(query) {
    return await db.users.findOne(query);
  }

  static async findById(id) {
    return await db.users.findOne({ _id: id });
  }

  static async findByIdAndUpdate(id, updates) {
    updates.updatedAt = new Date();
    await db.users.update({ _id: id }, { $set: updates });
    return await db.users.findOne({ _id: id });
  }

  static async find(query = {}, options = {}) {
    let cursor = db.users.find(query);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.limit) cursor = cursor.limit(options.limit);
    const users = await cursor.exec();
    return users.map(({ password, ...user }) => user);
  }

  static async count(query = {}) {
    return await db.users.count(query);
  }

  static async deleteMany(query = {}) {
    return await db.users.remove(query, { multi: true });
  }
}

module.exports = User;
