const express = require('express');
const router = express.Router();
const { 
  getEntities,
  createEntity,
  getEntity,
  updateEntity,
  deleteEntity,
  getEntityRelationships,
  searchEntities
} = require('../controllers/codex.controller');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes organized by project
router.route('/projects/:projectId/codex')
  .get(getEntities)
  .post(createEntity);

router.get('/projects/:projectId/codex/search', searchEntities);

// Entity-specific routes
router.route('/codex/:id')
  .get(getEntity)
  .put(updateEntity)
  .delete(deleteEntity);

router.get('/codex/:id/relationships', getEntityRelationships);

module.exports = router;