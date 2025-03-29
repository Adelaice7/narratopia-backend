// server/models/WritingStat.js
const mongoose = require('mongoose');

const WritingStatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  wordCount: {
    type: Number,
    default: 0,
    min: [0, 'Word count cannot be negative']
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  sessionsCount: {
    type: Number,
    default: 1,
    min: [1, 'Sessions count must be at least 1']
  }
});

// Ensure we only have one record per user/project/day
WritingStatSchema.index(
  { userId: 1, projectId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('WritingStat', WritingStatSchema);