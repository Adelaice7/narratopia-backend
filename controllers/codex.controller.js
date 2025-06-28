const Codex = require('../models/Codex');
const Project = require('../models/Project');
const Relationship = require('../models/Relationship');
const mongoose = require('mongoose');

// Check project ownership
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

// Valid entity types for validation
const VALID_ENTITY_TYPES = ['character', 'location', 'item', 'event', 'concept'];

// @desc    Get all codex entities for a project
// @route   GET /api/projects/:projectId/codex
// @access  Private
exports.getEntities = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const { type, search, tags } = req.query;
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Build query
    let query = { projectId };
    
    // Filter by type if provided
    if (type && VALID_ENTITY_TYPES.includes(type)) {
      query.type = type;
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    
    // Get entities
    const entities = await Codex.find(query).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: entities.length,
      data: entities
    });
  } catch (error) {
    console.error('Get codex entities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching codex entities',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Create a new codex entity
// @route   POST /api/projects/:projectId/codex
// @access  Private
exports.createEntity = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const { type, name, description, attributes, images, tags } = req.body;
    
    // Validate entity type
    if (!type || !VALID_ENTITY_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Entity type must be one of: ${VALID_ENTITY_TYPES.join(', ')}`
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
    
    // Create entity
    const entity = await Codex.create({
      projectId,
      type,
      name,
      description,
      attributes: attributes || {},
      images: images || [],
      tags: tags || []
    });
    
    res.status(201).json({
      success: true,
      data: entity
    });
  } catch (error) {
    console.error('Create codex entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating codex entity',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get a single codex entity
// @route   GET /api/codex/:id
// @access  Private
exports.getEntity = async (req, res) => {
  try {
    const entity = await Codex.findById(req.params.id);
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Codex entity not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(entity.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    res.status(200).json({
      success: true,
      data: entity
    });
  } catch (error) {
    console.error('Get codex entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching codex entity',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Update a codex entity
// @route   PUT /api/codex/:id
// @access  Private
exports.updateEntity = async (req, res) => {
  try {
    const { name, description, attributes, images, tags } = req.body;
    
    let entity = await Codex.findById(req.params.id);
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Codex entity not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(entity.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Build update object
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (attributes !== undefined) updateFields.attributes = attributes;
    if (images !== undefined) updateFields.images = images;
    if (tags !== undefined) updateFields.tags = tags;
    
    // Update the entity
    entity = await Codex.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: entity
    });
  } catch (error) {
    console.error('Update codex entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating codex entity',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Delete a codex entity
// @route   DELETE /api/codex/:id
// @access  Private
exports.deleteEntity = async (req, res) => {
  try {
    const entity = await Codex.findById(req.params.id);
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Codex entity not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(entity.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Delete entity
    await entity.remove();
    
    // Delete associated relationships
    await Relationship.deleteMany({ 
      $or: [
        { sourceId: req.params.id },
        { targetId: req.params.id }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: 'Codex entity deleted successfully'
    });
  } catch (error) {
    console.error('Delete codex entity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting codex entity',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get relationships for a codex entity
// @route   GET /api/codex/:id/relationships
// @access  Private
exports.getEntityRelationships = async (req, res) => {
  try {
    const entity = await Codex.findById(req.params.id);
    
    if (!entity) {
      return res.status(404).json({
        success: false,
        message: 'Codex entity not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(entity.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Get relationships where entity is either source or target
    const relationships = await Relationship.find({
      $or: [
        { sourceId: req.params.id },
        { targetId: req.params.id }
      ]
    });
    
    // Get IDs of all related entities
    const relatedEntityIds = new Set();
    relationships.forEach(rel => {
      relatedEntityIds.add(rel.sourceId.toString());
      relatedEntityIds.add(rel.targetId.toString());
    });
    // Remove the current entity ID
    relatedEntityIds.delete(req.params.id);
    
    // Get all related entities
    const relatedEntities = await Codex.find({
      _id: { $in: Array.from(relatedEntityIds) }
    }).select('name type');
    
    // Convert to a lookup map
    const entityMap = {};
    relatedEntities.forEach(entity => {
      entityMap[entity._id] = {
        id: entity._id,
        name: entity.name,
        type: entity.type
      };
    });
    
    // Enrich relationships with entity data
    const enrichedRelationships = relationships.map(rel => {
      const isSource = rel.sourceId.toString() === req.params.id;
      const otherEntityId = isSource ? rel.targetId : rel.sourceId;
      const otherEntity = entityMap[otherEntityId];
      
      return {
        id: rel._id,
        type: rel.type,
        direction: isSource ? 'outgoing' : 'incoming',
        description: rel.description,
        strength: rel.strength,
        entity: otherEntity
      };
    });
    
    res.status(200).json({
      success: true,
      count: enrichedRelationships.length,
      data: enrichedRelationships
    });
  } catch (error) {
    console.error('Get entity relationships error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching entity relationships',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Search codex entities
// @route   GET /api/projects/:projectId/codex/search
// @access  Private
exports.searchEntities = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { query, types } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
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
    
    // Build search query
    let searchQuery = {
      projectId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ]
    };
    
    // Filter by types if provided
    if (types) {
      const typeArray = types.split(',').filter(type => VALID_ENTITY_TYPES.includes(type));
      if (typeArray.length > 0) {
        searchQuery.type = { $in: typeArray };
      }
    }
    
    const entities = await Codex.find(searchQuery)
      .select('name type description tags')
      .sort({ name: 1 })
      .limit(20);
    
    res.status(200).json({
      success: true,
      count: entities.length,
      data: entities
    });
  } catch (error) {
    console.error('Search codex entities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching codex entities',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};