const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['Admin', 'Teacher', 'Student'],
    default: 'Student'
  },
  isActive: {
    type: Boolean,
    default: true // true = đang hoạt động, false = bị Admin khóa
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);