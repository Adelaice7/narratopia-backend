const express = require('express');
const router = express.Router();
const { 
  getProjects, 
  createProject, 
  getProject, 
  updateProject, 
  deleteProject,
  getProjectStats
} = require('../controllers/project.controller');
const { getChapters, createChapter } = require('../controllers/chapter.controller');
const { getEntities, createEntity } = require('../controllers/codex.controller');
const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

// Project routes
router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

router.get('/:id/stats', getProjectStats);

// Chapter routes for projects
router.route('/:id/chapters')
  .get(getChapters)
  .post(createChapter);

// Codex routes for projects
router.route('/:id/codex')
  .get(getEntities)
  .post(createEntity);

module.exports = router;