const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const Newsletter = require('../models/Newsletter');
const { body, validationResult } = require('express-validator');

// Validation for newsletter creation
const newsletterValidation = [
  body('subject').trim().isLength({ min: 3 }).escape()
    .withMessage('Subject must be at least 3 characters long'),
  body('content').isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long')
];

// Get all newsletters (admin only)
router.get('/', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const newsletters = await Newsletter.find()
      .populate('createdBy', 'username name email')
      .sort({ createdAt: -1 });

    res.json(newsletters);
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ message: 'Error fetching newsletters', error: error.message });
  }
});

// Get a single newsletter by ID
router.get('/:id', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id)
      .populate('createdBy', 'username name email');

    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    res.json(newsletter);
  } catch (error) {
    console.error('Error fetching newsletter:', error);
    res.status(500).json({ message: 'Error fetching newsletter', error: error.message });
  }
});

// Create a new newsletter
router.post('/', auth, authorize('admin', 'owner'), newsletterValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, content } = req.body;

    const newsletter = new Newsletter({
      subject,
      content,
      createdBy: req.user._id
    });

    await newsletter.save();

    res.status(201).json(newsletter);
  } catch (error) {
    console.error('Error creating newsletter:', error);
    res.status(500).json({ message: 'Error creating newsletter', error: error.message });
  }
});

// Update a newsletter
router.put('/:id', auth, authorize('admin', 'owner'), newsletterValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, content, status } = req.body;

    // Only update fields that were sent
    const updateData = {};
    if (subject) updateData.subject = subject;
    if (content) updateData.content = content;
    if (status) updateData.status = status;

    const newsletter = await Newsletter.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    res.json(newsletter);
  } catch (error) {
    console.error('Error updating newsletter:', error);
    res.status(500).json({ message: 'Error updating newsletter', error: error.message });
  }
});

// Delete a newsletter
router.delete('/:id', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const newsletter = await Newsletter.findByIdAndDelete(req.params.id);

    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    res.json({ message: 'Newsletter deleted successfully' });
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    res.status(500).json({ message: 'Error deleting newsletter', error: error.message });
  }
});

// Send a newsletter (mock - would normally connect to an email service)
router.post('/:id/send', auth, authorize('admin', 'owner'), async (req, res) => {
  try {
    const newsletter = await Newsletter.findById(req.params.id);

    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }

    if (newsletter.status === 'Sent') {
      return res.status(400).json({ message: 'Newsletter has already been sent' });
    }

    // Mock sending the newsletter
    const recipientCount = Math.floor(Math.random() * 1000) + 500; // Random number between 500-1500

    // Update newsletter with send details
    newsletter.status = 'Sent';
    newsletter.sentDate = new Date();
    newsletter.recipients = recipientCount;
    newsletter.openRate = `${Math.floor(Math.random() * 30) + 40}%`; // 40-70%
    newsletter.clickRate = `${Math.floor(Math.random() * 20) + 10}%`; // 10-30%

    await newsletter.save();

    res.json({ 
      message: 'Newsletter sent successfully',
      newsletter
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ message: 'Error sending newsletter', error: error.message });
  }
});

module.exports = router; 