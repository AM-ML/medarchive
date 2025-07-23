const express = require('express');
const router = express.Router();
const { sendContactFormEmail, sendContactAutoReplyEmail } = require('../utils/emailService');

// Middleware to validate contact form data
const validateContactForm = (req, res, next) => {
  const { name, email, subject, message } = req.body;
  
  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide all required fields: name, email, subject, and message' 
    });
  }
  
  // Email format validation (simple regex)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide a valid email address' 
    });
  }
  
  // Message length validation
  if (message.length < 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'Message must be at least 10 characters long' 
    });
  }
  
  next();
};

/**
 * @route   POST /api/contact
 * @desc    Submit a contact form
 * @access  Public
 */
router.post('/', validateContactForm, async (req, res) => {
  try {
    const contactData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || '',
      organization: req.body.organization || '',
      subject: req.body.subject,
      message: req.body.message
    };

    // Send email to admin
    await sendContactFormEmail(contactData);
    
    // Send auto-reply to user
    await sendContactAutoReplyEmail(contactData);

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. Thank you for contacting us!'
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send your message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 