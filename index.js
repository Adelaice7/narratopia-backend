console.log("🐣 Starting Narratopia backend...");

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/database');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const chapterRoutes = require('./routes/chapter.routes');
const codexRoutes = require('./routes/codex.routes');
const relationshipRoutes = require('./routes/relationship.routes');
const statsRoutes = require('./routes/stats.routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Indexes
const Project = require('./models/Project');
const Codex = require('./models/Codex');
const Relationship = require('./models/Relationship');

Promise.all([
  Project.createIndexes(),
  Codex.createIndexes(),
  Relationship.createIndexes()
]);


// Middleware
app.use(express.json({ limit: '50mb' })); // For parsing JSON
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For parsing URL-encoded data
app.use(cors()); // Enable CORS
app.use(helmet()); // Security headers
app.use(morgan('dev')); // HTTP request logger

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/codex', codexRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/stats', statsRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;