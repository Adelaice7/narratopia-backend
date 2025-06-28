const Chapter = require('../models/Chapter');
const Project = require('../models/Project');
const Version = require('../models/Version');
const mongoose = require('mongoose');

// Helper function to check project ownership
const checkProjectOwnership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) {
    return { error: 'Project not found', status: 404 };
  }
  if (project.userId.toString() !== userId) {
    return { error: 'Not authorized to access this project', status: 403 };
  }
  return { project };
};

// Count words in content
const countWords = (content) => {
  try {
    if (!content) return 0;
    
    // If content is a string (plain text)
    if (typeof content === 'string') {
      return content.split(/\s+/).filter(Boolean).length;
    }
    
    // If content is Draft.js raw content
    if (typeof content === 'object' && content.blocks) {
      return content.blocks
        .map(block => block.text.split(/\s+/).filter(Boolean).length)
        .reduce((sum, count) => sum + count, 0);
    }
    
    return 0;
  } catch (error) {
    console.error('Error counting words:', error);
    return 0;
  }
};

// @desc    Get all chapters for a project
// @route   GET /api/projects/:projectId/chapters
// @access  Private
exports.getChapters = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Get chapters
    const chapters = await Chapter.find({ projectId })
      .select('-content') // Exclude content for performance
      .sort({ orderIndex: 1 });
    
    res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters
    });
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapters',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Create a new chapter
// @route   POST /api/projects/:projectId/chapters
// @access  Private
exports.createChapter = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const { title, content, notes } = req.body;
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Get highest orderIndex
    const highestOrder = await Chapter.findOne({ projectId })
      .sort({ orderIndex: -1 })
      .select('orderIndex');
    
    const orderIndex = highestOrder ? highestOrder.orderIndex + 1 : 1;
    
    // Count words if content is provided
    const wordCount = content ? countWords(content) : 0;
    
    // Create chapter
    const chapter = await Chapter.create({
      projectId,
      title,
      content,
      notes,
      orderIndex,
      wordCount,
      isComplete: false
    });
    
    res.status(201).json({
      success: true,
      data: chapter
    });
  } catch (error) {
    console.error('Create chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating chapter',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get a single chapter
// @route   GET /api/chapters/:id
// @access  Private
exports.getChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(chapter.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    res.status(200).json({
      success: true,
      data: chapter
    });
  } catch (error) {
    console.error('Get chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching chapter',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Update a chapter
// @route   PUT /api/chapters/:id
// @access  Private
exports.updateChapter = async (req, res) => {
  try {
    const { title, content, notes, orderIndex, isComplete } = req.body;
    
    let chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(chapter.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Build update object
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) {
      updateFields.content = content;
      updateFields.wordCount = countWords(content);
    }
    if (notes !== undefined) updateFields.notes = notes;
    if (orderIndex !== undefined) updateFields.orderIndex = orderIndex;
    if (isComplete !== undefined) updateFields.isComplete = isComplete;
    
    // Update the chapter
    chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: chapter
    });
  } catch (error) {
    console.error('Update chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating chapter',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Delete a chapter
// @route   DELETE /api/chapters/:id
// @access  Private
exports.deleteChapter = async (req, res) => {
  try {
    console.log('DELETE request received for chapter ID:', req.params.id);
    const chapter = await Chapter.findById(req.params.id);
    console.log('Found chapter:', chapter ? chapter.title : 'NOT FOUND');
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(chapter.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Delete chapter
    console.log('Deleting chapter with ID:', req.params.id);
    const deleteResult = await Chapter.findByIdAndDelete(req.params.id);
    console.log('Chapter deletion result:', deleteResult ? 'SUCCESS' : 'FAILED');
    
    // Also delete associated versions
    const versionsDeleted = await Version.deleteMany({ chapterId: req.params.id });
    console.log('Deleted versions count:', versionsDeleted.deletedCount);
    
    // Reorder remaining chapters
    await Chapter.updateMany(
      { 
        projectId: chapter.projectId, 
        orderIndex: { $gt: chapter.orderIndex } 
      },
      { $inc: { orderIndex: -1 } }
    );
    
    console.log('Sending success response for chapter deletion');
    res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    console.error('Delete chapter error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting chapter',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Reorder chapters
// @route   PUT /api/projects/:projectId/chapters/reorder
// @access  Private
exports.reorderChapters = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { chapterOrder } = req.body;
    
    if (!Array.isArray(chapterOrder)) {
      return res.status(400).json({
        success: false,
        message: 'chapterOrder must be an array of chapter IDs'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Update each chapter's order
    const updatePromises = chapterOrder.map((chapterId, index) => {
      return Chapter.findOneAndUpdate(
        { _id: chapterId, projectId },
        { orderIndex: index + 1 }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: 'Chapters reordered successfully'
    });
  } catch (error) {
    console.error('Reorder chapters error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reordering chapters',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Create a version snapshot of a chapter
// @route   POST /api/chapters/:id/versions
// @access  Private
exports.createVersion = async (req, res) => {
  try {
    const { description } = req.body;
    
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(chapter.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Create version snapshot
    const version = await Version.create({
      projectId: chapter.projectId,
      chapterId: chapter._id,
      content: chapter.content,
      wordCount: chapter.wordCount,
      description: description || `Snapshot created on ${new Date().toLocaleDateString()}`
    });
    
    res.status(201).json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Create version error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating version',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get all versions of a chapter
// @route   GET /api/chapters/:id/versions
// @access  Private
exports.getVersions = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(chapter.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Get versions
    const versions = await Version.find({ chapterId: req.params.id })
      .select('-content') // Exclude content for performance
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: versions.length,
      data: versions
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching versions',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get a specific version
// @route   GET /api/versions/:id
// @access  Private
exports.getVersion = async (req, res) => {
  try {
    const version = await Version.findById(req.params.id);
    
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(version.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    res.status(200).json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching version',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Restore a chapter to a specific version
// @route   POST /api/versions/:id/restore
// @access  Private
exports.restoreVersion = async (req, res) => {
  try {
    const version = await Version.findById(req.params.id);
    
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(version.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Find the chapter
    const chapter = await Chapter.findById(version.chapterId);
    
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Associated chapter not found'
      });
    }
    
    // Create a new version with current content before restoring
    await Version.create({
      projectId: chapter.projectId,
      chapterId: chapter._id,
      content: chapter.content,
      wordCount: chapter.wordCount,
      description: 'Auto-saved before version restore'
    });
    
    // Restore chapter to version content
    chapter.content = version.content;
    chapter.wordCount = version.wordCount;
    await chapter.save();
    
    res.status(200).json({
      success: true,
      message: 'Chapter restored to selected version',
      data: chapter
    });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while restoring version',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};