const Relationship = require('../models/Relationship');
const Codex = require('../models/Codex');
const Project = require('../models/Project');
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

// Helper function to check if entity exists and belongs to project
const validateEntity = async (entityId, projectId) => {
  const entity = await Codex.findById(entityId);
  if (!entity) {
    return { error: 'Entity not found', status: 404 };
  }
  if (entity.projectId.toString() !== projectId.toString()) {
    return { error: 'Entity does not belong to this project', status: 400 };
  }
  return { entity };
};

// @desc    Get all relationships for a project
// @route   GET /api/projects/:projectId/relationships
// @access  Private
exports.getRelationships = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Get relationships
    const relationships = await Relationship.find({ projectId });
    
    // Get all entity IDs referenced in relationships
    const entityIds = new Set();
    relationships.forEach(rel => {
      entityIds.add(rel.sourceId.toString());
      entityIds.add(rel.targetId.toString());
    });
    
    // Get all referenced entities
    const entities = await Codex.find({
      _id: { $in: Array.from(entityIds) }
    }).select('name type');
    
    // Create entity lookup map
    const entityMap = {};
    entities.forEach(entity => {
      entityMap[entity._id] = {
        id: entity._id,
        name: entity.name,
        type: entity.type
      };
    });
    
    // Enrich relationships with entity data
    const enrichedRelationships = relationships.map(rel => ({
      id: rel._id,
      type: rel.type,
      description: rel.description,
      strength: rel.strength,
      source: entityMap[rel.sourceId] || { id: rel.sourceId, name: 'Unknown Entity', type: 'unknown' },
      target: entityMap[rel.targetId] || { id: rel.targetId, name: 'Unknown Entity', type: 'unknown' }
    }));
    
    res.status(200).json({
      success: true,
      count: enrichedRelationships.length,
      data: enrichedRelationships
    });
  } catch (error) {
    console.error('Get relationships error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching relationships',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Create a new relationship
// @route   POST /api/projects/:projectId/relationships
// @access  Private
exports.createRelationship = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { sourceId, targetId, type, description, strength, createInverse, inverseType } = req.body;
    
    if (!sourceId || !targetId || !type) {
      return res.status(400).json({
        success: false,
        message: 'sourceId, targetId, and type are required'
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
    
    // Validate source and target entities
    const sourceCheck = await validateEntity(sourceId, projectId);
    if (sourceCheck.error) {
      return res.status(sourceCheck.status).json({
        success: false,
        message: `Source entity: ${sourceCheck.error}`
      });
    }
    
    const targetCheck = await validateEntity(targetId, projectId);
    if (targetCheck.error) {
      return res.status(targetCheck.status).json({
        success: false,
        message: `Target entity: ${targetCheck.error}`
      });
    }
    
    // Check if relationship already exists
    const existingRelationship = await Relationship.findOne({
      projectId,
      sourceId,
      targetId,
      type
    });
    
    if (existingRelationship) {
      return res.status(400).json({
        success: false,
        message: 'This relationship already exists'
      });
    }
    
    // Create relationship
    const relationship = await Relationship.create({
      projectId,
      sourceId,
      targetId,
      type,
      description,
      strength: strength || 5
    });
    
    // Create inverse relationship if requested
    let inverseRelationship = null;
    if (createInverse) {
      inverseRelationship = await Relationship.create({
        projectId,
        sourceId: targetId,
        targetId: sourceId,
        type: inverseType || type,
        description,
        strength: strength || 5
      });
    }
    
    // Get entity details for response
    const source = await Codex.findById(sourceId).select('name type');
    const target = await Codex.findById(targetId).select('name type');
    
    res.status(201).json({
      success: true,
      data: {
        relationship: {
          ...relationship.toObject(),
          source: {
            id: source._id,
            name: source.name,
            type: source.type
          },
          target: {
            id: target._id,
            name: target.name,
            type: target.type
          }
        },
        inverseRelationship: inverseRelationship ? {
          ...inverseRelationship.toObject(),
          source: {
            id: target._id,
            name: target.name,
            type: target.type
          },
          target: {
            id: source._id,
            name: source.name,
            type: source.type
          }
        } : null
      }
    });
  } catch (error) {
    console.error('Create relationship error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating relationship',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get a single relationship
// @route   GET /api/relationships/:id
// @access  Private
exports.getRelationship = async (req, res) => {
  try {
    const relationship = await Relationship.findById(req.params.id);
    
    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(relationship.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Get source and target entities
    const [source, target] = await Promise.all([
      Codex.findById(relationship.sourceId).select('name type'),
      Codex.findById(relationship.targetId).select('name type')
    ]);
    
    const enrichedRelationship = {
      ...relationship.toObject(),
      source: source ? {
        id: source._id,
        name: source.name,
        type: source.type
      } : null,
      target: target ? {
        id: target._id,
        name: target.name,
        type: target.type
      } : null
    };
    
    res.status(200).json({
      success: true,
      data: enrichedRelationship
    });
  } catch (error) {
    console.error('Get relationship error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching relationship',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Update a relationship
// @route   PUT /api/relationships/:id
// @access  Private
exports.updateRelationship = async (req, res) => {
  try {
    const { type, description, strength } = req.body;
    
    let relationship = await Relationship.findById(req.params.id);
    
    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(relationship.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Build update object
    const updateFields = {};
    if (type !== undefined) updateFields.type = type;
    if (description !== undefined) updateFields.description = description;
    if (strength !== undefined) updateFields.strength = strength;
    
    // Update the relationship
    relationship = await Relationship.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    
    // Get source and target entities
    const [source, target] = await Promise.all([
      Codex.findById(relationship.sourceId).select('name type'),
      Codex.findById(relationship.targetId).select('name type')
    ]);
    
    const enrichedRelationship = {
      ...relationship.toObject(),
      source: source ? {
        id: source._id,
        name: source.name,
        type: source.type
      } : null,
      target: target ? {
        id: target._id,
        name: target.name,
        type: target.type
      } : null
    };
    
    res.status(200).json({
      success: true,
      data: enrichedRelationship
    });
  } catch (error) {
    console.error('Update relationship error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating relationship',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Delete a relationship
// @route   DELETE /api/relationships/:id
// @access  Private
exports.deleteRelationship = async (req, res) => {
  try {
    const relationship = await Relationship.findById(req.params.id);
    
    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: 'Relationship not found'
      });
    }
    
    // Check project ownership
    const ownershipCheck = await checkProjectOwnership(relationship.projectId, req.user.id);
    if (ownershipCheck.error) {
      return res.status(ownershipCheck.status).json({
        success: false,
        message: ownershipCheck.error
      });
    }
    
    // Delete relationship
    await relationship.remove();
    
    res.status(200).json({
      success: true,
      message: 'Relationship deleted successfully'
    });
  } catch (error) {
    console.error('Delete relationship error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting relationship',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};

// @desc    Get network graph data for visualization
// @route   GET /api/projects/:projectId/relationships/network
// @access  Private
exports.getNetworkData = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { types } = req.query;
    
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
    
    // Filter by entity types if specified
    let entityTypeFilter = {};
    if (types) {
      const typeArray = types.split(',');
      entityTypeFilter = { type: { $in: typeArray } };
    }
    
    // Get all entities for this project (filtered by type if applicable)
    const entities = await Codex.find({ 
      projectId,
      ...entityTypeFilter
    }).select('name type');
    
    // Get all entity IDs
    const entityIds = entities.map(entity => entity._id.toString());
    
    // Get relationships where both source and target are in our entity list
    const relationships = await Relationship.find({
      projectId,
      sourceId: { $in: entityIds },
      targetId: { $in: entityIds }
    });
    
    // Create nodes for network graph
    const nodes = entities.map(entity => ({
      id: entity._id,
      label: entity.name,
      group: entity.type,
      title: entity.name // hover text
    }));
    
    // Create edges for network graph
    const edges = relationships.map(rel => ({
      id: rel._id,
      from: rel.sourceId,
      to: rel.targetId,
      label: rel.type,
      title: rel.description || rel.type,
      value: rel.strength || 1
    }));
    
    res.status(200).json({
      success: true,
      data: {
        nodes,
        edges
      }
    });
  } catch (error) {
    console.error('Get network data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching network data',
      error: process.env.NODE_ENV === 'production' ? {} : error
    });
  }
};