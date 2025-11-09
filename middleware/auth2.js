const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');

// Web session authentication
const webAuth = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please login to continue');
    return res.redirect('/login');
  }
  next();
};

// Web admin authentication
const webAdmin = (req, res, next) => {
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

// API authentication
const apiAuth = async (req, res, next) => {
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

// API admin authentication
const apiAdmin = async (req, res, next) => {
  try {
    await apiAuth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { isAuth: webAuth, isAdmin: webAdmin, apiAuth, apiAdmin };