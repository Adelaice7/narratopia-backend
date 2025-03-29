const mongoose = require('mongoose');

const RelationshipSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Codex',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Codex',
    required: true
  },
  type: {
    type: String,
    required: [true, 'Relationship type is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  strength: {
    type: Number,
    min: [1, 'Strength must be at least 1'],
    max: [10, 'Strength cannot be more than 10'],
    default: 5
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

// Ensure unique relationship types between the same entities
RelationshipSchema.index(
  { projectId: 1, sourceId: 1, targetId: 1, type: 1 },
  { unique: true }
);

// Update the updatedAt field on save
RelationshipSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Relationship', RelationshipSchema);