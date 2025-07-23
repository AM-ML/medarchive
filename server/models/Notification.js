const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        // Either type or targetUsers should have at least one entry
        return v.length > 0 || (this.targetUsers && this.targetUsers.length > 0);
      },
      message: 'At least one role type or target user must be specified'
    }
  },
  targetUsers: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: []
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  link: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Index to improve query performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ targetUsers: 1 });
notificationSchema.index({ readBy: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 