const fs = require('fs');
const path = require('path');
const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const backupDir = path.join(__dirname, '../backups');
const archiveDir = path.join(__dirname, '../archives');
const migrationDir = path.join(__dirname, '../migrations');

[backupDir, archiveDir, migrationDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function isSafePath(baseDir, filePath) {
  const resolved = path.resolve(baseDir, filePath);
  return resolved.startsWith(path.resolve(baseDir));
}

class DataService {
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

  async getAllData() {
    const data = {};
    for (const [name, repo] of Object.entries(this.repos)) {
      data[name] = await repo.find({});
    }
    return data;
  }

  async createBackup(description, type, userId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      version: '1.0', timestamp: new Date(), type: type || 'full',
      description: description || 'Manual backup', createdBy: userId,
      data: await this.getAllData()
    };

    const filename = `backup-${timestamp}.json`;
    fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(backupData, null, 2));

    const manifest = {
      filename, timestamp: backupData.timestamp, type: backupData.type,
      description: backupData.description,
      size: fs.statSync(path.join(backupDir, filename)).size,
      collections: Object.keys(backupData.data).length,
      records: Object.values(backupData.data).reduce((sum, arr) => sum + arr.length, 0)
    };

    const manifestFile = path.join(backupDir, 'manifest.json');
    let manifests = [];
    if (fs.existsSync(manifestFile)) manifests = JSON.parse(fs.readFileSync(manifestFile));
    manifests.push(manifest);
    fs.writeFileSync(manifestFile, JSON.stringify(manifests, null, 2));

    return manifest;
  }

  async getBackups() {
    const manifestFile = path.join(backupDir, 'manifest.json');
    let manifests = [];
    if (fs.existsSync(manifestFile)) manifests = JSON.parse(fs.readFileSync(manifestFile));
    return manifests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async restoreBackup(filename) {
    if (!isSafePath(backupDir, filename)) throw new Error('Invalid filename');
    const filepath = path.join(backupDir, filename);
    if (!fs.existsSync(filepath)) throw new Error('Backup not found');

    const backup = JSON.parse(fs.readFileSync(filepath));
    if (!backup.data) throw new Error('Invalid backup format');

    const collectionMap = {
      users: this.repos.users, productionCycles: this.repos.productionCycles,
      dailyLogs: this.repos.dailyLogs, medications: this.repos.medications,
      inventory: this.repos.inventory, orders: this.repos.orders,
      qualityChecks: this.repos.qualityChecks, complianceRecords: this.repos.complianceRecords,
      audits: this.repos.audits, customerProfiles: this.repos.customerProfiles,
      feedback: this.repos.feedback, campaigns: this.repos.campaigns
    };

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

  async deleteBackup(filename) {
    if (!isSafePath(backupDir, filename)) throw new Error('Invalid filename');
    const filepath = path.join(backupDir, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

    const manifestFile = path.join(backupDir, 'manifest.json');
    if (fs.existsSync(manifestFile)) {
      let manifests = JSON.parse(fs.readFileSync(manifestFile));
      manifests = manifests.filter(m => m.filename !== filename);
      fs.writeFileSync(manifestFile, JSON.stringify(manifests, null, 2));
    }
  }

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
