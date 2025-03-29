const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getUser, 
  updateUser, 
  changePassword 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/user', protect, getUser);
router.put('/user', protect, updateUser);
router.put('/password', protect, changePassword);

module.exports = router;