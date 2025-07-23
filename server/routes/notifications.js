const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

// Validation middleware
const notificationValidation = [
  body('message').trim().notEmpty()
    .withMessage('Message is required'),
  body('by').optional().isMongoId()
    .withMessage('Invalid user ID'),
  body('link').optional().isURL()
    .withMessage('Link must be a valid URL'),
  body('type').optional().isArray({ min: 0 })
    .withMessage('Type must be an array of roles'),
  body('targetUsers').optional().isArray({ min: 0 })
    .withMessage('Target users must be an array of user IDs')
];

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for the authenticated user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    console.log(`Fetching notifications for user: ${req.user._id}, role: ${req.user.role}`);
    const userRole = req.user.role;
    const userId = req.user._id;
    
    // Find notifications that:
    // 1. Target the user's role OR specifically target this user
    // 2. Have not been read by this user yet
    const notifications = await Notification.find({
      $or: [
        { type: { $in: [userRole] } },
        { targetUsers: userId }
      ],
      readBy: { $ne: userId }
    })
      .populate('by', 'username name title avatar')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${notifications.length} notifications for user ${userId}`);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @access  Private (writers/admins only)
 */
router.post('/', auth, authorize('writer', 'admin', 'owner'), notificationValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { type = [], targetUsers = [], message, by, link } = req.body;
    console.log(`Creating manual notification: message=${message}, type=${type}, targetUsers=${targetUsers.length}`);
    
    // Validate that at least one targeting method is specified
    if (type.length === 0 && targetUsers.length === 0) {
      return res.status(400).json({
        message: 'At least one role type or target user must be specified'
      });
    }
    
    // Validate roles in type array
    if (type.length > 0) {
      const validRoles = ['user', 'writer', 'admin', 'owner'];
      const invalidRoles = type.filter(role => !validRoles.includes(role));
      
      if (invalidRoles.length > 0) {
        return res.status(400).json({ 
          message: `Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoles.join(', ')}` 
        });
      }
    }
    
    // Validate user IDs in targetUsers array
    if (targetUsers.length > 0) {
      try {
        const users = await User.find({ _id: { $in: targetUsers } }).select('_id');
        if (users.length !== targetUsers.length) {
          console.error('Invalid users found:', {
            requestedIds: targetUsers,
            foundIds: users.map(u => u._id)
          });
          return res.status(400).json({
            message: 'One or more target user IDs are invalid'
          });
        }
      } catch (error) {
        console.error('Error validating target users:', error);
        return res.status(400).json({
          message: 'Invalid user ID format in targetUsers array'
        });
      }
    }
    
    // Create the notification
    const notification = new Notification({
      type,
      targetUsers,
      message,
      by: by || req.user._id, // Use provided 'by' or default to current user
      link: link || '',
      readBy: []
    });
    
    await notification.save();
    console.log(`Manual notification created with ID: ${notification._id}`);
    
    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read by the current user
 * @access  Private
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    console.log(`Marking notification ${notificationId} as read for user ${userId}`);
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      console.log(`Notification not found: ${notificationId}`);
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if user should receive this notification
    const isRoleTargeted = notification.type.includes(req.user.role);
    const isUserTargeted = notification.targetUsers.some(targetId => targetId.toString() === userId.toString());
    
    if (!isRoleTargeted && !isUserTargeted) {
      console.log(`User ${userId} not authorized for notification ${notificationId}`);
      return res.status(403).json({ message: 'This notification is not intended for you' });
    }
    
    // Check if already read by this user
    if (notification.readBy.some(readerId => readerId.toString() === userId.toString())) {
      console.log(`Notification ${notificationId} already read by user ${userId}`);
      return res.json({ notification });
    }
    
    // Add user to readBy array
    notification.readBy.push(userId);
    await notification.save();
    console.log(`Notification ${notificationId} marked as read by user ${userId}`);
    
    res.json({ notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read', error: error.message });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for the current user
 * @access  Private
 */
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    console.log(`Marking all notifications as read for user ${userId}, role ${userRole}`);
    
    // Find all notifications that target this user's role or specifically target this user
    const notifications = await Notification.find({
      $or: [
        { type: { $in: [userRole] } },
        { targetUsers: userId }
      ],
      readBy: { $ne: userId } // Only get unread notifications
    });
    
    if (notifications.length === 0) {
      console.log(`No unread notifications found for user ${userId}`);
      return res.json({ success: true, count: 0 });
    }
    
    console.log(`Found ${notifications.length} notifications to mark as read`);
    
    // Add the user to the readBy array for each notification
    const updatePromises = notifications.map(notification => {
      notification.readBy.push(userId);
      return notification.save();
    });
    
    await Promise.all(updatePromises);
    
    console.log(`Marked ${notifications.length} notifications as read for user ${userId}`);
    
    res.json({ 
      success: true, 
      count: notifications.length 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      message: 'Error marking all notifications as read', 
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get the count of unread notifications for the authenticated user
 * @access  Private
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    
    // Count notifications that:
    // 1. Target the user's role OR specifically target this user
    // 2. Have not been read by this user yet
    const count = await Notification.countDocuments({
      $or: [
        { type: { $in: [userRole] } },
        { targetUsers: userId }
      ],
      readBy: { $ne: userId }
    });
    
    console.log(`User ${userId} has ${count} unread notifications`);
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ 
      message: 'Error counting unread notifications', 
      error: error.message 
    });
  }
});

module.exports = router; 