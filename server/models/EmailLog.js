const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BuyerAccount',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Action Required', 'Handled'],
    default: 'Action Required',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  snippet: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('EmailLog', emailLogSchema);
