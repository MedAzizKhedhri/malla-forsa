const mongoose = require('mongoose');

// A photo of a lost article. `cause` says who lost it: Shein in Europe (never
// reached us) or the transporteur on the way to us. Photos sharing the same
// `group` name within a cause are shown together (e.g. "Last arrivage"); an
// empty group means the photo is ungrouped.
const lostItemSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'La photo est requise'],
    trim: true,
  },
  cause: {
    type: String,
    enum: ['shein', 'transporteur'],
    default: 'shein',
  },
  // Transporteur name (like Colis.carrier), only meaningful when cause = transporteur
  transporteur: {
    type: String,
    default: '',
    trim: true,
  },
  group: {
    type: String,
    default: '',
    trim: true,
  },
  // Optional value of the article, in dinars and/or euros
  priceTnd: {
    type: Number,
    min: 0,
    default: null,
  },
  priceEur: {
    type: Number,
    min: 0,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LostItem', lostItemSchema);
