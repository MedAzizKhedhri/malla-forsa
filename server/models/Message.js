const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  customer_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  is_read: {
    type: Boolean,
    default: false
  },
  admin_notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
