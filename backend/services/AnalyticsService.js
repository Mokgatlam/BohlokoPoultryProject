const { ProductionCycle, DailyLog, Medication, FeedRecord } = require('../models/Production');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const User = require('../models/User');

class AnalyticsService {
  async getProductionAnalytics() {
    const cycles = await ProductionCycle.find({ status: 'Completed' });
    const logs = await DailyLog.find();

    const analytics = {
      totalCycles: cycles.length,
      averageCycleDuration: 0,
      mortalityRate: 0,
      feedConversionRatio: 0,
      costAnalysis: { totalBudget: 0, totalActual: 0, variance: 0 },
      performance: cycles.map(c => ({
        name: c.cycleName,
        type: c.productionType,
        expectedBirds: c.expectedBirds,
        actualBirds: c.actualBirds,
        completionRate: c.expectedBirds > 0 ? ((c.actualBirds / c.expectedBirds) * 100).toFixed(2) : 0
      }))
    };

    if (cycles.length > 0) {
      analytics.costAnalysis.totalBudget = cycles.reduce((s, c) => s + (c.budget?.total || 0), 0);
      analytics.costAnalysis.totalActual = cycles.reduce((s, c) => s + (c.actualCosts?.total || 0), 0);
      analytics.costAnalysis.variance = analytics.costAnalysis.totalBudget - analytics.costAnalysis.totalActual;
    }

    if (logs.length > 0) {
      const totalMortality = logs.reduce((s, l) => s + (l.mortality?.count || 0), 0);
      const totalBirds = logs.reduce((s, l) => s + l.birdCount, 0);
      analytics.mortalityRate = totalBirds > 0 ? ((totalMortality / totalBirds) * 100).toFixed(2) : 0;
      const totalFeed = logs.reduce((s, l) => s + (l.feedConsumption || 0), 0);
      analytics.feedConversionRatio = totalFeed > 0 ? (totalFeed / totalBirds).toFixed(2) : 0;
    }

    return analytics;
  }

  async getSalesAnalytics() {
    const orders = await Order.find({ status: 'Delivered' });
    const allOrders = await Order.find();

    const analytics = {
      totalOrders: allOrders.length,
      completedOrders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + o.total, 0),
      averageOrderValue: 0,
      revenueByProduct: {},
      revenueByPaymentMethod: {},
      revenueByDeliveryOption: {},
      revenueByMonth: {},
      revenueByCustomerType: {},
      pendingPayments: allOrders.filter(o => o.paymentStatus === 'Pending').length,
      refunds: allOrders.filter(o => o.paymentStatus === 'Refunded').length
    };

    if (orders.length > 0) {
      analytics.averageOrderValue = analytics.totalRevenue / orders.length;
      orders.forEach(order => {
        order.items?.forEach(item => {
          analytics.revenueByProduct[item.productName] = (analytics.revenueByProduct[item.productName] || 0) + item.total;
        });
        analytics.revenueByPaymentMethod[order.paymentMethod] = (analytics.revenueByPaymentMethod[order.paymentMethod] || 0) + order.total;
        analytics.revenueByDeliveryOption[order.deliveryOption] = (analytics.revenueByDeliveryOption[order.deliveryOption] || 0) + order.total;

        const month = new Date(order.createdAt).toISOString().slice(0, 7);
        analytics.revenueByMonth[month] = (analytics.revenueByMonth[month] || 0) + order.total;
      });
    }

    return analytics;
  }

  async getInventoryAnalytics() {
    const inventory = await Inventory.find();
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const analytics = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((s, i) => s + (i.quantity * (i.pricePerUnit || 0)), 0),
      totalQuantity: inventory.reduce((s, i) => s + i.quantity, 0),
      byStatus: {},
      byProductType: {},
      byLocation: {},
      nearExpiry: [],
      expired: [],
      slowMoving: [],
      turnoverRate: 0,
      holdingCost: 0,
      wastePercentage: 0,
      summary: { available: 0, reserved: 0, sold: 0, expired: 0, damaged: 0 }
    };

    inventory.forEach(item => {
      analytics.byStatus[item.status] = (analytics.byStatus[item.status] || 0) + item.quantity;
      analytics.byProductType[item.productType] = (analytics.byProductType[item.productType] || 0) + item.quantity;
      analytics.byLocation[item.storageLocation] = (analytics.byLocation[item.storageLocation] || 0) + item.quantity;
      analytics.summary[item.status] = (analytics.summary[item.status] || 0) + 1;

      if (item.expiryDate <= weekFromNow && item.status === 'available') {
        analytics.nearExpiry.push({ batchNumber: item.batchNumber, productType: item.productType, quantity: item.quantity });
      }
      if (item.expiryDate < now && item.status === 'available') {
        analytics.expired.push({ batchNumber: item.batchNumber, productType: item.productType });
      }
      // Holding cost (estimated R2/kg/day)
      if (item.status === 'available') {
        analytics.holdingCost += item.quantity * 2;
      }
    });

    analytics.wastePercentage = analytics.totalQuantity > 0
      ? ((analytics.summary.expired + analytics.summary.damaged) / analytics.totalQuantity * 100).toFixed(1)
      : 0;

    return analytics;
  }

  // FR-018: Profit & Loss Statement
  async getProfitLoss() {
    const orders = await Order.find({ status: 'Delivered' });
    const cycles = await ProductionCycle.find();
    const inventory = await Inventory.find();
    const feedRecords = await FeedRecord.find({});
    const medications = await Medication.find({});

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const totalCOGS = orders.reduce((s, o) => s + (o.items?.reduce((sum, i) => sum + (i.cost || 0), 0) || 0), 0);

    // Production costs
    const feedCost = feedRecords.reduce((s, f) => s + (f.cost || 0), 0);
    const medicationCost = medications.reduce((s, m) => s + (m.cost || 0), 0);
    const laborCost = cycles.reduce((s, c) => s + (c.actualCosts?.labor || 0), 0);
    const utilityCost = cycles.reduce((s, c) => s + (c.actualCosts?.utilities || 0), 0);
    const totalProductionCost = feedCost + medicationCost + laborCost + utilityCost;

    // Inventory costs
    const inventoryValue = inventory.reduce((s, i) => s + (i.quantity * (i.pricePerUnit || 0)), 0);
    const wasteValue = inventory.filter(i => i.status === 'expired' || i.status === 'damaged')
      .reduce((s, i) => s + (i.quantity * (i.pricePerUnit || 0)), 0);

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalProductionCost;

    return {
      revenue: {
        salesRevenue: totalRevenue,
        otherRevenue: 0,
        totalRevenue
      },
      costOfGoodsSold: {
        beginningInventory: 0,
        productionCosts: totalProductionCost,
        purchases: 0,
        endingInventory: inventoryValue,
        totalCOGS: totalCOGS || (totalProductionCost - inventoryValue)
      },
      grossProfit,
      operatingExpenses: {
        labor: laborCost,
        feed: feedCost,
        medications: medicationCost,
        utilities: utilityCost,
        waste: wasteValue,
        holding: inventoryValue * 0.02,
        total: totalProductionCost + wasteValue + (inventoryValue * 0.02)
      },
      netProfit,
      profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0
    };
  }

  // FR-019: Inventory Aging Report
  async getInventoryAging() {
    const inventory = await Inventory.find({ status: 'available' });
    const now = new Date();

    const aging = {
      '0-3 days': { count: 0, quantity: 0, value: 0 },
      '4-7 days': { count: 0, quantity: 0, value: 0 },
      '8-14 days': { count: 0, quantity: 0, value: 0 },
      '15-30 days': { count: 0, quantity: 0, value: 0 },
      '30+ days': { count: 0, quantity: 0, value: 0 }
    };

    inventory.forEach(item => {
      const harvestDate = new Date(item.harvestDate);
      const ageDays = Math.floor((now - harvestDate) / (1000 * 60 * 60 * 24));
      const value = item.quantity * (item.pricePerUnit || 0);

      if (ageDays <= 3) { aging['0-3 days'].count++; aging['0-3 days'].quantity += item.quantity; aging['0-3 days'].value += value; }
      else if (ageDays <= 7) { aging['4-7 days'].count++; aging['4-7 days'].quantity += item.quantity; aging['4-7 days'].value += value; }
      else if (ageDays <= 14) { aging['8-14 days'].count++; aging['8-14 days'].quantity += item.quantity; aging['8-14 days'].value += value; }
      else if (ageDays <= 30) { aging['15-30 days'].count++; aging['15-30 days'].quantity += item.quantity; aging['15-30 days'].value += value; }
      else { aging['30+ days'].count++; aging['30+ days'].quantity += item.quantity; aging['30+ days'].value += value; }
    });

    return aging;
  }

  async getDashboard() {
    const activeCycles = await ProductionCycle.count({ status: 'In Progress' });
    const pendingOrders = await Order.count({ status: 'Pending' });
    const totalInventory = await Inventory.count({ status: 'available' });
    const pendingUsers = await User.count({ status: 'pending' });
    const recentOrders = (await Order.find()).slice(0, 5);
    const lowStock = (await Inventory.find({ status: 'available' })).filter(i => i.quantity < 10);

    const orders = await Order.find({ status: 'Delivered' });
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

    return {
      activeCycles,
      pendingOrders,
      totalInventory,
      pendingUsers,
      recentOrders,
      lowStockAlerts: lowStock.length,
      totalRevenue,
      completedOrders: orders.length
    };
  }
}

module.exports = new AnalyticsService();