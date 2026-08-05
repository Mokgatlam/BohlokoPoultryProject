/**
 * PasswordReset Model - FR-002.3
 * =================================
 * 
 * Manages password reset tokens for the forgot/reset password flow.
 * 
 * FR-002.3 Requirements:
 *   - Generate cryptographically secure tokens (32 bytes random hex)
 *   - Tokens expire after 1 hour
 *   - Tokens are single-use (marked as used after successful reset)
 *   - Previous tokens for a user are invalidated when new one is created
 * 
 * Architecture: Data Access Object (DAO) pattern
 * Database: NeDB (file-based, MongoDB-compatible)
 * 
 * Security Principles:
 *   - Tokens are cryptographically random (crypto.randomBytes)
 *   - Tokens expire to limit attack window
 *   - Single-use prevents replay attacks
 *   - Previous tokens invalidated to prevent token accumulation
 */

const db = require('../config/db');
const crypto = require('crypto');

const PasswordReset = {
  /**
   * Get the passwordResets collection from database.
   * @returns {Object} NeDB datastore for password reset tokens
   */
  getCollection() { return db.passwordResets; },

  /**
   * Create a new password reset token for a user.
   * 
   * Automatically invalidates any existing tokens for this user
   * to prevent token accumulation attacks.
   * 
   * @param {string} userId - User's unique identifier
   * @returns {Object} { token: string, expiresAt: Date }
   */
  async createToken(userId) {
    // Invalidate any previous tokens for this user (security)
    await this.getCollection().remove({ userId }, { multi: true });
    
    // Generate cryptographically secure random token (32 bytes = 64 hex chars)
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    const doc = { token, userId, expiresAt, used: false };
    await this.getCollection().insert(doc);
    return { token, expiresAt };
  },

  /**
   * Find a valid (unused) token.
   * 
   * @param {string} token - The reset token to look up
   * @returns {Object|null} Token record or null if not found/used
   */
  async findByToken(token) {
    return await this.getCollection().findOne({ token, used: false });
  },

  /**
   * Mark a token as used to prevent reuse.
   * 
   * Security: Tokens are single-use to prevent replay attacks.
   * 
   * @param {string} token - The reset token to mark as used
   */
  async markUsed(token) {
    await this.getCollection().update({ token }, { $set: { used: true } });
  },

  /**
   * Clean up expired tokens from the database.
   * 
   * Should be called periodically (e.g., daily cron job)
   * to prevent database bloat from expired tokens.
   * 
   * @returns {number} Number of expired tokens removed
   */
  async cleanExpired() {
    await this.getCollection().remove({ expiresAt: { $lt: new Date() } }, { multi: true });
  }
};

module.exports = PasswordReset;
