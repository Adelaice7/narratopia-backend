const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI | 'mongodb://root:example@localhost:27017/narratopia-db?authSource=admin';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;