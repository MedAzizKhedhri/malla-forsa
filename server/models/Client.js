const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  contactInfo: {
    type: String,
  },
  nombreArticles: {
    type: Number,
    default: 0,
  },
  compteAcheteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BuyerAccount',
  },
  isPriority: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Client', clientSchema);
