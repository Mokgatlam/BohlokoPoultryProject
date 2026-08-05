const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');
const contactService = require('../services/ContactService');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/contact
// @desc    Submit a contact message
// @access  Public
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('phone').optional().isLength({ max: 20 }).withMessage('Phone must be 20 characters or less')
], validate, async (req, res) => {
  try {
    const message = await contactService.createMessage(req.body);
    res.status(201).json({ success: true, message: 'Message sent successfully. We will get back to you soon.', data: message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   GET /api/contact
// @desc    Get all contact messages
// @access  Private - Farm Manager
router.get('/', protect, authorize('Farm Manager'), [
  query('status').optional().isIn(['unread', 'read', 'responded', 'archived']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    const messages = await contactService.getAll(query);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/contact/statistics
// @desc    Get contact message statistics
// @access  Private - Farm Manager
router.get('/statistics', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const stats = await contactService.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/contact/:id
// @desc    Get a contact message by ID
// @access  Private - Farm Manager
router.get('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const message = await contactService.getById(req.params.id);
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/contact/:id/status
// @desc    Update contact message status
// @access  Private - Farm Manager
router.put('/:id/status', protect, authorize('Farm Manager'), [
  body('status').isIn(['unread', 'read', 'responded', 'archived']).withMessage('Invalid status')
], validate, async (req, res) => {
  try {
    const message = await contactService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete a contact message
// @access  Private - Farm Manager
router.delete('/:id', protect, authorize('Farm Manager'), async (req, res) => {
  try {
    const result = await contactService.delete(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

module.exports = router;