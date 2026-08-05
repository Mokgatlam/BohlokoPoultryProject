const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const medicationService = require('../services/MedicationService');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const medications = await medicationService.getAll(req.query);
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/active', protect, async (req, res) => {
  try {
    const medications = await medicationService.getActive();
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/expiring', protect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const medications = await medicationService.getExpiring(days);
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/cycle/:cycleId', protect, async (req, res) => {
  try {
    const medications = await medicationService.getByCycle(req.params.cycleId);
    res.json({ success: true, data: medications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const medication = await medicationService.getById(req.params.id);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('cycle').notEmpty().withMessage('Cycle is required'),
  body('medicationName').notEmpty().withMessage('Medication name is required'),
  body('dosage').notEmpty().withMessage('Dosage is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const medication = await medicationService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('Farm Manager', 'Poultry Attendant'), [
  body('medicationName').optional().trim().notEmpty().withMessage('Medication name cannot be empty'),
  body('dosage').optional().trim().notEmpty().withMessage('Dosage cannot be empty'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const medication = await medicationService.update(req.params.id, req.body);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/complete', protect, authorize('Farm Manager', 'Poultry Attendant'), async (req, res) => {
  try {
    const medication = await medicationService.complete(req.params.id);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/cancel', protect, authorize('Farm Manager'), [
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const medication = await medicationService.cancel(req.params.id, req.body.reason);
    if (!medication) return res.status(404).json({ success: false, message: 'Medication not found' });
    res.json({ success: true, data: medication });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
