const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    maxlength: [50, 'Username cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'sepia'],
      default: 'light'
    },
    fontFamily: {
      type: String,
      default: 'Georgia'
    },
    fontSize: {
      type: Number,
      default: 16,
      min: [8, 'Font size must be at least 8px'],
      max: [36, 'Font size cannot be more than 36px']
    },
    autoSaveInterval: {
      type: Number,
      default: 30,
      min: [5, 'Auto-save interval must be at least 5 seconds'],
      max: [300, 'Auto-save interval cannot be more than 300 seconds']
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in DB
UserSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);