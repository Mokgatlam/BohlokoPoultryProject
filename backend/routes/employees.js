const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const validate = require('../middleware/validate');
const employeeService = require('../services/EmployeeService');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const employees = await employeeService.getAll(req.query);
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/departments', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const departments = await employeeService.getDepartments();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await employeeService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const employee = await employeeService.getById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/user/:userId', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const employee = await employeeService.getByUserId(req.params.userId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('Farm Manager'), [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('position').notEmpty().withMessage('Position is required'),
  body('department').notEmpty().withMessage('Department is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const employee = await employeeService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('Farm Manager'), [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('position').optional().trim().notEmpty().withMessage('Position cannot be empty'),
  body('department').optional().trim().notEmpty().withMessage('Department cannot be empty'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must be 20 characters or less')
], validate, async (req, res) => {
  try {
    const employee = await employeeService.update(req.params.id, req.body);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id/status', protect, authorize('Farm Manager'), [
  body('status').isIn(['active', 'inactive', 'terminated', 'on_leave'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const employee = await employeeService.updateStatus(req.params.id, req.body.status);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
