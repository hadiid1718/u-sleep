const express = require('express');
const router = express.Router();
const { adminLogin, getAdminProfile } = require('../controllers/AdminController');
const {authenticateAdmin} = require('../middleware/auth');

// Public route - Login
router.post('/login', adminLogin);

// Protected routes - Require authentication
router.get('/profile', authenticateAdmin, getAdminProfile);
router.get('/dashboard', authenticateAdmin, (req, res) => {
  res.json({ 
    message: 'Welcome to admin dashboard',
    admin: req.admin 
  });
});

// Add more protected admin routes here
// router.get('/users', authenticateAdmin, getAllUsers);
// router.delete('/user/:id', authenticateAdmin, deleteUser);

module.exports = router;