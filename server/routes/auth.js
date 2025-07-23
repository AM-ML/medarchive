const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/emailService');

// Validation middleware
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
];

// Register route
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create and send JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Longer expiration for new users
    );

    // Set HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Must be true when sameSite is 'none'
      sameSite: 'none', // Changed to none to work with any origin
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Also return token in response for client-side storage
    res.status(201).json({ 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, rememberMe = false } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token with expiration based on rememberMe
    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    // Set HTTP-only cookie with expiration based on rememberMe
    const maxAge = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000  // 30 days
      : 24 * 60 * 60 * 1000;      // 1 day

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Must be true when sameSite is 'none'
      sameSite: 'none', // Changed to none to work with any origin
      maxAge
    });

    // Also return token in response for client-side storage
    res.json({ 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token,
      rememberMe
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  // Clear the HTTP-only cookie
  res.cookie('token', '', {
    httpOnly: true,
    secure: true, // Must be true when sameSite is 'none'
    sameSite: 'none', // Changed to none to work with any origin
    expires: new Date(0)
  });
  
  res.json({ message: 'Logged out successfully' });
});

// Verify admin access
router.get('/verify-admin', auth, async (req, res) => {
  try {
    const userRole = req.user.role.toLowerCase();
    const isAdmin = userRole === 'admin' || userRole === 'owner';
    
    if (isAdmin) {
      return res.json({ 
        isAdmin: true, 
        role: req.user.role,
        message: 'User has admin access' 
      });
    } else {
      return res.status(403).json({ 
        isAdmin: false,
        message: 'User does not have admin access'
      });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user route
router.get('/me', async (req, res) => {
  try {
    // Get token from cookie or authorization header
    const token = req.cookies.token || 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ user });
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   POST /api/auth/send-verification-email
 * @desc    Send email verification link
 * @access  Private
 */
router.post('/send-verification-email', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Email already verified' 
      });
    }
    
    // Generate verification token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Send verification email
    await sendVerificationEmail(user, token);
    
    res.json({ 
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending verification email', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: 'No verification token provided' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find and update user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Check if email matches token
    if (user.email !== decoded.email) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification token' 
      });
    }
    
    // Update user's email verification status
    user.emailVerified = true;
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    
    // Handle JWT verification errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        success: false,
        message: 'Verification token expired' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error verifying email', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      return res.json({ 
        success: true,
        message: 'If a user with that email exists, a password reset link has been sent.' 
      });
    }
    
    // Generate reset token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // TODO: Implement password reset email functionality
    // For now, just return success
    
    res.json({ 
      success: true,
      message: 'If a user with that email exists, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', [
  body('token').exists(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    
    const { token, password } = req.body;
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.json({ 
      success: true,
      message: 'Password reset successful' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    
    // Handle JWT verification errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid reset token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ 
        success: false,
        message: 'Reset token expired' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error resetting password', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/auth/verify-admin
 * @desc    Check if current user has admin access
 * @access  Private
 */
router.get('/verify-admin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ isAdmin: false, message: 'User not found' });
    }
    
    const normalizedRole = user.role.toLowerCase();
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'owner';
    
    res.json({ isAdmin, role: user.role });
  } catch (error) {
    console.error('Error verifying admin status:', error);
    res.status(500).json({ isAdmin: false, message: 'Server error' });
  }
});

module.exports = router; 