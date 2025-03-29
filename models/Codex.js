const mongoose = require('mongoose');

const CodexSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  type: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: ['character', 'location', 'item', 'event', 'concept'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Entity name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  attributes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  images: [String],
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create text index for search
CodexSchema.index({ name: 'text', description: 'text', tags: 'text' });
CodexSchema.index({ projectId: 1, type: 1 });

// Update the updatedAt field on save
CodexSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Codex', CodexSchema);