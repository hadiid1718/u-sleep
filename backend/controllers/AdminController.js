 const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Create predefined admin if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: 'Hadeed.admin' });
    if (!adminExists) {
      await Admin.create({
        username: process.env.ADMIN_USERNAME ,
        password: process.env.ADMIN_PASS , 
        role: 'admin'
      });
      console.log(' Default admin created successfully');
      console.log('Username: Hadeed.admin');
    } else {
      console.log('Default admin already exists');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

createDefaultAdmin();

const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Please provide both username and password' 
      });
    }

    // Find admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: admin._id, 
        role: admin.role,
        username: admin.username 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
};

// Get admin profile (protected route example)
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ 
        message: 'Admin not found' 
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = {
  adminLogin,
  getAdminProfile
};
