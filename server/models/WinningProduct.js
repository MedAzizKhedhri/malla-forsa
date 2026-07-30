const mongoose = require('mongoose');

const winningProductSchema = new mongoose.Schema({
  screenshot: {
    type: String,
    required: [true, 'La capture d\'écran est requise'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('WinningProduct', winningProductSchema);
