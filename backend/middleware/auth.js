const jwt = require('jsonwebtoken');
const User = require("../models/User");
const Admin = require('../models/Admin');

// GENERATING TOKEN
const generateToken = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_KEY, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
  
  // FIX: Return accessToken instead of token
  return { accessToken, refreshToken };
};

// JWT TOKEN VERIFICATION
const verifyToken = (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

// User authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Token is missing or invalid format",
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = await verifyToken(token, process.env.JWT_SECRET_KEY);
    
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User not found or inactive",
      });
    }
    
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token is expired",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

// Admin authenticate middleware
const authenticateAdmin = async (req, res, next) => {
    try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                  req.header('token') || 
                  req.header('accessToken');

    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Get admin from database
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({ 
        message: 'Invalid token. Admin not found.' 
      });
    }

    // Attach admin to request object
    req.admin = admin;
    req.userId = admin._id;
    
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    }
    
    res.status(500).json({ message: 'Server error during authentication.' });
  }

};

module.exports = {
  generateToken,
  verifyToken,
  authenticateUser,
  authenticateAdmin
};