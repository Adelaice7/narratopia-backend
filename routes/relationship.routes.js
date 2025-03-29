const express = require('express');
const router = express.Router();
const { 
  getRelationships,
  createRelationship,
  getRelationship,
  updateRelationship,
  deleteRelationship,
  getNetworkData
} = require('../controllers/relationship.controller');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes organized by project
router.route('/projects/:projectId/relationships')
  .get(getRelationships)
  .post(createRelationship);

router.get('/projects/:projectId/relationships/network', getNetworkData);

// Relationship-specific routes
router.route('/relationships/:id')
  .get(getRelationship)
  .put(updateRelationship)
  .delete(deleteRelationship);

module.exports = router;