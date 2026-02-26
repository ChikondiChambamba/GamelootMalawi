const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

// Middleware for web session authentication
const isWebAuth = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to continue');
    return res.redirect('/login');
  }
  next();
};

// Middleware for admin authentication

// Middleware for checking if user is admin
const isAdmin = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to continue');
    return res.redirect('/login');
  }
  
  if (req.session.user.role !== 'admin') {
    req.flash('error', 'Access denied. Admin privileges required.');
    return res.redirect('/');
  }
  
  next();
};

// API authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = {
  isAuth: auth,
  isAdmin: adminAuth,
  auth,
  adminAuth
};
