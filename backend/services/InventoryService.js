const BaseRepository = require('../repositories/BaseRepository');
const db = require('../config/db');

class InventoryService {
  constructor() {
    this.repo = new BaseRepository(db.inventory);
  }

  async create(data, user) {
    const batchNumber = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return await this.repo.create({ ...data, batchNumber, createdBy: user._id });
  }

  async getAll(filters = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.productType) query.productType = filters.productType;
    if (filters.location) query.storageLocation = filters.location;
    return await this.repo.find(query);
  }

  async getLowStock() {
    const threshold = (await db.systemConfig.findOne({ key: 'lowStockThreshold' }))?.value || 10;
    const all = await this.repo.find({ status: 'available' });
    return all.filter(item => item.quantity < threshold);
  }

  async adjust(id, adjustment, reason) {
    const batch = await this.repo.findById(id);
    if (!batch) throw new Error('Batch not found');
    const newQty = Math.max(0, batch.quantity + adjustment);
    return await this.repo.findByIdAndUpdate(id, { quantity: newQty });
  }

  async transfer(id, toLocation, transferQty, reason, user) {
    const batch = await this.repo.findById(id);
    if (!batch) throw new Error('Batch not found');
    if (transferQty > batch.quantity) throw new Error('Transfer quantity exceeds available stock');

    const newBatchNumber = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const newBatch = await this.repo.create({
      cycle: batch.cycle,
      productType: batch.productType,
      quantity: transferQty,
      batchNumber: newBatchNumber,
      harvestDate: batch.harvestDate,
      expiryDate: batch.expiryDate,
      storageLocation: toLocation,
      pricePerUnit: batch.pricePerUnit,
      status: 'available',
      transferredFrom: batch._id,
      transferReason: reason,
      createdBy: user._id
    });

    const newQty = batch.quantity - transferQty;
    await this.repo.findByIdAndUpdate(id, {
      quantity: newQty,
      status: newQty === 0 ? 'transferred' : batch.status
    });

    return { from: { ...batch, quantity: newQty }, to: newBatch };
  }

  async getTransfers() {
    return await this.repo.find({ transferredFrom: { $exists: true } });
  }

  async getPickingList(orderId) {
    const Order = require('../models/Order');
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    const inventory = await this.repo.find({ status: 'available' });
    const pickingList = {
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customer: order.customer,
      items: [],
      status: 'pending'
    };

    for (const item of order.items) {
      const available = inventory.filter(i =>
        i.productType === item.productName && i.quantity > 0
      ).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      let remaining = item.quantity;
      const allocations = [];

      for (const batch of available) {
        if (remaining <= 0) break;
        const allocQty = Math.min(remaining, batch.quantity);
        allocations.push({
          batchNumber: batch.batchNumber,
          storageLocation: batch.storageLocation,
          quantity: allocQty,
          expiryDate: batch.expiryDate
        });
        remaining -= allocQty;
      }

      pickingList.items.push({
        product: item.productName,
        requestedQty: item.quantity,
        allocations,
        fulfilled: remaining <= 0,
        shortfall: remaining > 0 ? remaining : 0
      });
    }

    pickingList.allFulfilled = pickingList.items.every(i => i.fulfilled);
    return pickingList;
  }

  async getReport() {
    const inventory = await this.repo.find();
    const report = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, i) => sum + (i.quantity * (i.pricePerUnit || 0)), 0),
      totalQuantity: inventory.reduce((sum, i) => sum + i.quantity, 0),
      byStatus: {}, byProductType: {}, byLocation: {},
      nearExpiry: [], expired: [],
      summary: { available: 0, reserved: 0, sold: 0, expired: 0, damaged: 0, transferred: 0 }
    };

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    inventory.forEach(item => {
      report.byStatus[item.status] = (report.byStatus[item.status] || 0) + 1;
      report.byProductType[item.productType] = (report.byProductType[item.productType] || 0) + item.quantity;
      report.byLocation[item.storageLocation] = (report.byLocation[item.storageLocation] || 0) + item.quantity;
      report.summary[item.status] = (report.summary[item.status] || 0) + 1;

      if (item.expiryDate <= now && item.status === 'available') {
        report.expired.push({ batchNumber: item.batchNumber, productType: item.productType, quantity: item.quantity, expiryDate: item.expiryDate });
      } else if (item.expiryDate <= weekFromNow && item.status === 'available') {
        report.nearExpiry.push({ batchNumber: item.batchNumber, productType: item.productType, quantity: item.quantity, expiryDate: item.expiryDate });
      }
    });

    report.turnoverRate = report.totalQuantity > 0 ? (report.summary.sold / report.totalQuantity * 100).toFixed(1) : 0;
    return report;
  }

  async count(query = {}) {
    return await this.repo.count(query);
  }
}

module.exports = new InventoryService();
