const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from cookie or authorization header
    const token = req.cookies.token || 
      (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authorization failed: No user found' });
    }

    // Owner role has access to everything (super-admin)
    if (req.user.role.toLowerCase() === 'owner') {
      return next();
    }

    // Case-insensitive role check
    const userRole = req.user.role.toLowerCase();
    const hasRole = roles.some(role => role.toLowerCase() === userRole);

    if (!hasRole) {
      return res.status(403).json({
        message: `Access denied: Requires ${roles.join(' or ')} role`
      });
    }

    next();
  };
};

module.exports = { auth, authorize }; 