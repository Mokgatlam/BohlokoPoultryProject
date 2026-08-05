/**
 * Data Service
 * ============
 * 
 * SRS Reference: FR-015 (User Account Management - Data Retention)
 * 
 * System-level data management service handling backups, restores, exports,
 * and data statistics across all collections. Provides the data retention
 * and archival capabilities required by FR-015.
 * 
 * Responsibilities:
 *   - Full database backup creation with metadata manifest
 *   - Backup restoration with duplicate detection
 *   - Backup deletion with manifest cleanup
 *   - Data export by collection type
 *   - System-wide statistics aggregation
 *   - Directory management for backups, archives, migrations
 * 
 * Security:
 *   - Path traversal prevention via isSafePath() helper
 *   - Backup filenames validated against directory escape
 *   - Only valid JSON backup files are processed
 * 
 * File Structure:
 *   backend/backups/     - Backup JSON files + manifest.json
 *   backend/archives/    - Archived data
 *   backend/migrations/  - Database migration files
 * 
 * Dependencies: fs (filesystem), path, BaseRepository, db, uuid
 */

const fs = require('fs');
const path = require('path');
const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Directory paths for data management
const backupDir = path.join(__dirname, '../backups');
const archiveDir = path.join(__dirname, '../archives');
const migrationDir = path.join(__dirname, '../migrations');

// Ensure directories exist (create if missing)
[backupDir, archiveDir, migrationDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Path traversal prevention helper.
 * 
 * Security: Ensures a file path stays within the allowed base directory.
 * Prevents attacks like "../../etc/passwd" by resolving and comparing paths.
 * 
 * @param {string} baseDir - Allowed base directory
 * @param {string} filePath - User-provided file path
 * @returns {boolean} True if path is safe (within baseDir)
 */
function isSafePath(baseDir, filePath) {
  const resolved = path.resolve(baseDir, filePath);
  return resolved.startsWith(path.resolve(baseDir));
}

class DataService {
  /**
   * Initialize repositories for all collections that can be backed up/restored.
   * 
   * Collections managed:
   *   - users, productionCycles, dailyLogs, medications, inventory
   *   - orders, qualityChecks, complianceRecords, audits
   *   - customerProfiles, feedback, campaigns
   */
  constructor() {
    this.repos = {
      users: new BaseRepository(db.users),
      productionCycles: new BaseRepository(db.productionCycles),
      dailyLogs: new BaseRepository(db.dailyLogs),
      medications: new BaseRepository(db.medications),
      inventory: new BaseRepository(db.inventory),
      orders: new BaseRepository(db.orders),
      qualityChecks: new BaseRepository(db.qualityChecks),
      complianceRecords: new BaseRepository(db.complianceRecords),
      audits: new BaseRepository(db.audits),
      customerProfiles: new BaseRepository(db.customerProfiles),
      feedback: new BaseRepository(db.feedbackComplaints),
      campaigns: new BaseRepository(db.promotionalCampaigns)
    };
  }

  /**
   * Get all data from all collections.
   * 
   * SRS: FR-015 - Data export
   * Used internally for backup creation.
   * 
   * @returns {Object} { collectionName: [records], ... }
   */
  async getAllData() {
    const data = {};
    for (const [name, repo] of Object.entries(this.repos)) {
      data[name] = await repo.find({});
    }
    return data;
  }

  /**
   * Create a full database backup with metadata manifest.
   * 
   * SRS: FR-015 - Data retention policies, backup creation
   * 
   * Process:
   *   1. Fetch all data from all collections
   *   2. Create timestamped JSON backup file
   *   3. Update manifest.json with backup metadata
   *   4. Return manifest with file info
   * 
   * Backup file format: backup-{ISO-timestamp}.json
   * Manifest tracks: filename, timestamp, type, description, size, collection/record counts
   * 
   * @param {string} description - Backup description
   * @param {string} type - Backup type ('full', 'incremental', etc.)
   * @param {string} userId - ID of user creating backup
   * @returns {Object} Backup manifest with metadata
   */
  async createBackup(description, type, userId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      version: '1.0', timestamp: new Date(), type: type || 'full',
      description: description || 'Manual backup', createdBy: userId,
      data: await this.getAllData()
    };

    // Write backup file
    const filename = `backup-${timestamp}.json`;
    fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(backupData, null, 2));

    // Create manifest entry
    const manifest = {
      filename, timestamp: backupData.timestamp, type: backupData.type,
      description: backupData.description,
      size: fs.statSync(path.join(backupDir, filename)).size,
      collections: Object.keys(backupData.data).length,
      records: Object.values(backupData.data).reduce((sum, arr) => sum + arr.length, 0)
    };

    // Update manifest file
    const manifestFile = path.join(backupDir, 'manifest.json');
    let manifests = [];
    if (fs.existsSync(manifestFile)) manifests = JSON.parse(fs.readFileSync(manifestFile));
    manifests.push(manifest);
    fs.writeFileSync(manifestFile, JSON.stringify(manifests, null, 2));

    return manifest;
  }

  /**
   * Get list of all backups from manifest.
   * 
   * SRS: FR-015 - Backup listing
   * Sorted by timestamp descending (newest first)
   * 
   * @returns {Array} Backup manifests
   */
  async getBackups() {
    const manifestFile = path.join(backupDir, 'manifest.json');
    let manifests = [];
    if (fs.existsSync(manifestFile)) manifests = JSON.parse(fs.readFileSync(manifestFile));
    return manifests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Restore database from a backup file.
   * 
   * SRS: FR-015 - Data restoration
   * 
   * Process:
   *   1. Validate filename (path traversal prevention)
   *   2. Read and parse backup JSON
   *   3. For each collection's records:
   *      a. Check if record already exists (by _id)
   *      b. Create only if not exists (prevents duplicates)
   *   4. Return restoration summary
   * 
   * Security: Uses isSafePath() to prevent directory traversal attacks
   * 
   * @param {string} filename - Backup filename to restore
   * @returns {Object} { message, backup: { timestamp, type }, restoredCount }
   */
  async restoreBackup(filename) {
    if (!isSafePath(backupDir, filename)) throw new Error('Invalid filename');
    const filepath = path.join(backupDir, filename);
    if (!fs.existsSync(filepath)) throw new Error('Backup not found');

    const backup = JSON.parse(fs.readFileSync(filepath));
    if (!backup.data) throw new Error('Invalid backup format');

    // Map collection names to repository instances
    const collectionMap = {
      users: this.repos.users, productionCycles: this.repos.productionCycles,
      dailyLogs: this.repos.dailyLogs, medications: this.repos.medications,
      inventory: this.repos.inventory, orders: this.repos.orders,
      qualityChecks: this.repos.qualityChecks, complianceRecords: this.repos.complianceRecords,
      audits: this.repos.audits, customerProfiles: this.repos.customerProfiles,
      feedback: this.repos.feedback, campaigns: this.repos.campaigns
    };

    // Restore records (skip duplicates)
    let restoredCount = 0;
    for (const [name, records] of Object.entries(backup.data)) {
      const repo = collectionMap[name];
      if (repo && Array.isArray(records)) {
        for (const record of records) {
          const { _id, ...data } = record;
          const existing = await repo.findById(_id).catch(() => null);
          if (!existing) { await repo.create(data).catch(() => {}); restoredCount++; }
        }
      }
    }

    return { message: `Backup restored. ${restoredCount} records restored.`, backup: { timestamp: backup.timestamp, type: backup.type }, restoredCount };
  }

  /**
   * Delete a backup file and its manifest entry.
   * 
   * SRS: FR-015 - Data retention cleanup
   * Security: Uses isSafePath() to prevent directory traversal
   * 
   * @param {string} filename - Backup filename to delete
   */
  async deleteBackup(filename) {
    if (!isSafePath(backupDir, filename)) throw new Error('Invalid filename');
    const filepath = path.join(backupDir, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    // Remove from manifest
    const manifestFile = path.join(backupDir, 'manifest.json');
    if (fs.existsSync(manifestFile)) {
      let manifests = JSON.parse(fs.readFileSync(manifestFile));
      manifests = manifests.filter(m => m.filename !== filename);
      fs.writeFileSync(manifestFile, JSON.stringify(manifests, null, 2));
    }
  }

  /**
   * Export data by collection type.
   * 
   * SRS: FR-015 - Data export for external use
   * 
   * Supported types: 'users', 'orders', 'inventory', 'all'
   * 
   * @param {string} type - Collection type to export
   * @param {string} format - Export format (currently returns raw data)
   * @returns {Object} { type, format, data }
   */
  async exportData(type, format) {
    let data;
    switch (type) {
      case 'users': data = await this.repos.users.find({}); break;
      case 'orders': data = await this.repos.orders.find({}); break;
      case 'inventory': data = await this.repos.inventory.find({}); break;
      case 'all': data = await this.getAllData(); break;
      default: throw new Error('Invalid export type');
    }
    return { type, format, data };
  }

  /**
   * Get system-wide statistics across all collections.
   * 
   * SRS: FR-015 - System data statistics
   * 
   * Returns:
   *   - Record counts for each collection
   *   - Backup, archive, and migration file counts
   *   - Total records across all collections
   * 
   * @returns {Object} System statistics
   */
  async getStats() {
    const stats = {};
    for (const [name, repo] of Object.entries(this.repos)) {
      stats[name] = await repo.count();
    }
    stats.backups = fs.existsSync(backupDir) ? fs.readdirSync(backupDir).filter(f => f.endsWith('.json') && !f.includes('manifest')).length : 0;
    stats.archives = fs.existsSync(archiveDir) ? fs.readdirSync(archiveDir).filter(f => f.endsWith('.json')).length : 0;
    stats.migrations = fs.existsSync(migrationDir) ? fs.readdirSync(migrationDir).filter(f => f.endsWith('.json')).length : 0;
    stats.totalRecords = Object.values(stats).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0) - stats.backups - stats.archives - stats.migrations;
    return stats;
  }
}

module.exports = new DataService();