const express = require('express');
const router = express.Router();
const { 
  recordSession,
  getProjectStats,
  getUserStats
} = require('../controllers/stats.controller');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// User-level stats
router.get('/', getUserStats);

// Project-level stats
router.route('/projects/:projectId/stats')
  .get(getProjectStats)
  .post(recordSession);

module.exports = router;