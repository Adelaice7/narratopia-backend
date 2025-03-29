const express = require('express');
const router = express.Router();
const { 
  getChapters,
  createChapter,
  getChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  createVersion,
  getVersions,
  getVersion,
  restoreVersion
} = require('../controllers/chapter.controller');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Routes organized by project
router.route('/projects/:projectId/chapters')
  .get(getChapters)
  .post(createChapter);

router.put('/projects/:projectId/chapters/reorder', reorderChapters);

// Routes organized by chapter
router.route('/chapters/:id')
  .get(getChapter)
  .put(updateChapter)
  .delete(deleteChapter);

router.route('/chapters/:id/versions')
  .get(getVersions)
  .post(createVersion);

// Version-specific routes
router.get('/versions/:id', getVersion);
router.post('/versions/:id/restore', restoreVersion);

module.exports = router;