const mongoose = require('mongoose');

// A photo of a lost article. Photos sharing the same `group` name are shown
// together (e.g. "Last arrivage"); an empty group means the photo is ungrouped.
const lostItemSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'La photo est requise'],
    trim: true,
  },
  group: {
    type: String,
    default: '',
    trim: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LostItem', lostItemSchema);
