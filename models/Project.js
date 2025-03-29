const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  genre: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String
  },
  wordCountGoal: {
    type: Number,
    default: 50000,
    min: [0, 'Word count goal cannot be negative']
  },
  dailyWordCountGoal: {
    type: Number,
    default: 500,
    min: [0, 'Daily word count goal cannot be negative']
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastOpenedAt: {
    type: Date,
    default: Date.now
  }
});

ProjectSchema.index({ userId: 1 });

// Update the updatedAt field on save
ProjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);