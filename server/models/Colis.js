const mongoose = require('mongoose');

const colisSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: () => `Colis ${new Date().toLocaleDateString('fr-FR')}`,
  },
  trackingNumber: {
    type: String,
    trim: true,
    maxlength: 50,
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
  clients: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
    default: [],
  },
  screenshots: {
    type: [String],
    default: [],
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
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Colis', colisSchema);
