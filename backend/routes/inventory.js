const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const inventoryService = require('../services/InventoryService');
const { protect, authorize } = require('../middleware/auth');
const { PRODUCT_TYPES } = require('../config/constants');

router.post('/', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('cycle').notEmpty(),
  body('productType').isIn(PRODUCT_TYPES),
  body('quantity').isFloat({ min: 0 }),
  body('harvestDate').isISO8601(),
  body('expiryDate').isISO8601(),
  body('storageLocation').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const batch = await inventoryService.create(req.body, req.user);
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const inventory = await inventoryService.getAll(req.query);
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/low-stock', protect, async (req, res) => {
  try {
    const lowStock = await inventoryService.getLowStock();
    res.json({ success: true, data: lowStock });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id/adjust', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('adjustment').isNumeric(),
  body('reason').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const batch = await inventoryService.adjust(req.params.id, req.body.adjustment, req.body.reason);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.put('/:id/transfer', protect, authorize('Farm Manager', 'Processing Staff'), [
  body('toLocation').notEmpty().withMessage('Destination location is required'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const result = await inventoryService.transfer(req.params.id, req.body.toLocation, parseFloat(req.body.quantity), req.body.reason, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('exceeds') ? 400 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

router.get('/transfers', protect, async (req, res) => {
  try {
    const transfers = await inventoryService.getTransfers();
    res.json({ success: true, data: transfers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/picking-list/:orderId', protect, authorize('Farm Manager', 'Processing Staff', 'Sales Assistant'), async (req, res) => {
  try {
    const pickingList = await inventoryService.getPickingList(req.params.orderId);
    res.json({ success: true, data: pickingList });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message || 'Server error' });
  }
});

router.get('/report', protect, authorize('Farm Manager', 'Sales Assistant'), async (req, res) => {
  try {
    const report = await inventoryService.getReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
