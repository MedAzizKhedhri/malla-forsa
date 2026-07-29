const mongoose = require('mongoose');

const colisSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  carrier: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  panier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderSession',
  },
  nombreArticles: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Transit', 'Arrived at Carrier', 'Picked Up', 'In Stock'],
    default: 'Pending',
  },
  arrivalDate: {
    type: Date,
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Colis', colisSchema);
