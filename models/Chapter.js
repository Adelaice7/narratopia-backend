// server/models/Chapter.js
const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  orderIndex: {
    type: Number,
    required: true,
    min: [1, 'Order index must be at least 1']
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  wordCount: {
    type: Number,
    default: 0,
    min: [0, 'Word count cannot be negative']
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
ChapterSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Chapter', ChapterSchema);