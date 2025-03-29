const WritingStats = require('../models/WritingStats');
const Project = require('../models/Project');
const Chapter = require('../models/Chapter');
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

// @desc    Record a writing session
// @route   POST /api/projects/:projectId/stats
// @access  Private
exports.recordSession = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { wordCount, timeSpent, date } = req.body;
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Parse date or use current date
    const sessionDate = date ? new Date(date) : new Date();
    
    // Normalize date to start of day
    sessionDate.setHours(0, 0, 0, 0);
    
    // Check if there's already a stat for this date
    let stat = await WritingStats.findOne({
      userId: req.user.id,
      projectId,
      date: sessionDate
    });
    
    if (stat) {
      // Update existing stat
      stat.wordCount += wordCount || 0;
      stat.timeSpent += timeSpent || 0;
      stat.sessionsCount += 1;
      
      await stat.save();
    } else {
      // Create new stat
      stat = await WritingStats.create({
        userId: req.user.id,
        projectId,
        date: sessionDate,
        wordCount: wordCount || 0,
        timeSpent: timeSpent || 0,
        sessionsCount: 1
      });
    }
    
    res.status(200).json({
      success: true,
      data: stat
    });
  } catch (error) {
    console.error('Record session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while recording session',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get writing stats for a project
// @route   GET /api/projects/:projectId/stats
// @access  Private
exports.getProjectStats = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    
    // Query parameters
    const query = {
      userId: req.user.id,
      projectId
    };
    
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }
    
    // Get stats
    const stats = await WritingStats.find(query).sort({ date: 1 });
    
    // Calculate total stats
    const totalWordCount = stats.reduce((sum, stat) => sum + stat.wordCount, 0);
    const totalTimeSpent = stats.reduce((sum, stat) => sum + stat.timeSpent, 0);
    const totalSessions = stats.reduce((sum, stat) => sum + stat.sessionsCount, 0);
    
    // Calculate daily average for days with writing
    const daysWithWriting = stats.length;
    const avgWordsPerDay = daysWithWriting > 0 ? totalWordCount / daysWithWriting : 0;
    const avgTimePerDay = daysWithWriting > 0 ? totalTimeSpent / daysWithWriting : 0;
    
    // Get current total word count from chapters
    const chapters = await Chapter.find({ projectId });
    const currentWordCount = chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0);
    
    // Get project goal
    const project = await Project.findById(projectId).select('wordCountGoal dailyWordCountGoal');
    
    res.status(200).json({
      success: true,
      data: {
        dailyStats: stats,
        totals: {
          wordCount: totalWordCount,
          timeSpent: totalTimeSpent,
          sessions: totalSessions,
          daysWithWriting
        },
        averages: {
          wordsPerDay: avgWordsPerDay,
          timePerDay: avgTimePerDay,
          wordsPerMinute: totalTimeSpent > 0 ? totalWordCount / (totalTimeSpent / 60) : 0
        },
        progress: {
          currentWordCount,
          goalWordCount: project.wordCountGoal || 0,
          percentComplete: project.wordCountGoal ? (currentWordCount / project.wordCountGoal) * 100 : 0,
          dailyGoal: project.dailyWordCountGoal || 0
        }
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

// @desc    Get writing stats for a user across all projects
// @route   GET /api/stats
// @access  Private
exports.getUserStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    
    // Query parameters
    const query = {
      userId: req.user.id
    };
    
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }
    
    // Get stats
    const stats = await WritingStats.find(query);
    
    // Get projects to include names
    const projectIds = [...new Set(stats.map(stat => stat.projectId.toString()))];
    const projects = await Project.find({ _id: { $in: projectIds } }).select('title');
    
    // Create project lookup map
    const projectMap = {};
    projects.forEach(project => {
      projectMap[project._id] = project.title;
    });
    
    // Group stats by project
    const projectStats = {};
    stats.forEach(stat => {
      const projectId = stat.projectId.toString();
      if (!projectStats[projectId]) {
        projectStats[projectId] = {
          projectId,
          projectName: projectMap[projectId] || 'Unknown Project',
          wordCount: 0,
          timeSpent: 0,
          sessions: 0,
          days: 0,
          dailyStats: []
        };
      }
      
      projectStats[projectId].wordCount += stat.wordCount;
      projectStats[projectId].timeSpent += stat.timeSpent;
      projectStats[projectId].sessions += stat.sessionsCount;
      projectStats[projectId].days += 1;
      projectStats[projectId].dailyStats.push({
        date: stat.date,
        wordCount: stat.wordCount,
        timeSpent: stat.timeSpent,
        sessions: stat.sessionsCount
      });
    });
    
    // Calculate total stats
    const totalWordCount = stats.reduce((sum, stat) => sum + stat.wordCount, 0);
    const totalTimeSpent = stats.reduce((sum, stat) => sum + stat.timeSpent, 0);
    const totalSessions = stats.reduce((sum, stat) => sum + stat.sessionsCount, 0);
    
    // Group by date for overall trend
    const dateStats = {};
    stats.forEach(stat => {
      const dateStr = stat.date.toISOString().split('T')[0];
      if (!dateStats[dateStr]) {
        dateStats[dateStr] = {
          date: stat.date,
          wordCount: 0,
          timeSpent: 0,
          sessions: 0
        };
      }
      
      dateStats[dateStr].wordCount += stat.wordCount;
      dateStats[dateStr].timeSpent += stat.timeSpent;
      dateStats[dateStr].sessions += stat.sessionsCount;
    });
    
    res.status(200).json({
      success: true,
      data: {
        byProject: Object.values(projectStats),
        byDate: Object.values(dateStats).sort((a, b) => a.date - b.date),
        totals: {
          wordCount: totalWordCount,
          timeSpent: totalTimeSpent,
          sessions: totalSessions,
          days: Object.keys(dateStats).length,
          projects: Object.keys(projectStats).length
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user stats',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};