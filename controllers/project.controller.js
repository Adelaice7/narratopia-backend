const Project = require('../models/Project');
const Chapter = require('../models/Chapter');
const Codex = require('../models/Codex');

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { title, description, genre, coverImage, wordCountGoal, dailyWordCountGoal } = req.body;

    // Create project
    const project = await Project.create({
      userId: req.user.id,
      title,
      description,
      genre,
      coverImage,
      wordCountGoal,
      dailyWordCountGoal
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating project',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get a single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    // Update lastOpenedAt
    project.lastOpenedAt = Date.now();
    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    const { title, description, genre, coverImage, wordCountGoal, dailyWordCountGoal, isArchived } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    // Update project fields
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (genre !== undefined) updateFields.genre = genre;
    if (coverImage !== undefined) updateFields.coverImage = coverImage;
    if (wordCountGoal !== undefined) updateFields.wordCountGoal = wordCountGoal;
    if (dailyWordCountGoal !== undefined) updateFields.dailyWordCountGoal = dailyWordCountGoal;
    if (isArchived !== undefined) updateFields.isArchived = isArchived;

    // Update the project
    project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating project',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }

    // Delete project and all related data
    await Promise.all([
      // Delete project
      project.remove(),
      // Delete chapters
      Chapter.deleteMany({ projectId: req.params.id }),
      // Delete codex entries
      Codex.deleteMany({ projectId: req.params.id })
      // Add other related collections here
    ]);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get project stats
// @route   GET /api/projects/:id/stats
// @access  Private
exports.getProjectStats = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user owns the project
    if (project.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    // Get chapters and calculate total word count
    const chapters = await Chapter.find({ projectId: req.params.id });
    
    const totalWordCount = chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0);
    
    // Count codex entries by type
    const codexEntries = await Codex.aggregate([
      { $match: { projectId: mongoose.Types.ObjectId(req.params.id) } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    // Transform codex counts to object
    const codexCounts = {};
    codexEntries.forEach(entry => {
      codexCounts[entry._id] = entry.count;
    });

    // Calculate progress percentage
    const progressPercentage = project.wordCountGoal 
      ? Math.round((totalWordCount / project.wordCountGoal) * 100) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalWordCount,
        chapterCount: chapters.length,
        codexCounts,
        progressPercentage,
        wordCountGoal: project.wordCountGoal,
        dailyWordCountGoal: project.dailyWordCountGoal
      }
    });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project stats',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};