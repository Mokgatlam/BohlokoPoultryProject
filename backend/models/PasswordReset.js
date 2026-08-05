const db = require('../config/db');
const crypto = require('crypto');

const PasswordReset = {
  getCollection() { return db.passwordResets; },

  async createToken(userId) {
    await this.getCollection().remove({ userId }, { multi: true });
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const doc = { token, userId, expiresAt, used: false };
    await this.getCollection().insert(doc);
    return { token, expiresAt };
  },

  async findByToken(token) {
    return await this.getCollection().findOne({ token, used: false });
  },

  async markUsed(token) {
    await this.getCollection().update({ token }, { $set: { used: true } });
  },

  async cleanExpired() {
    await this.getCollection().remove({ expiresAt: { $lt: new Date() } }, { multi: true });
  }
};

module.exports = PasswordReset;
