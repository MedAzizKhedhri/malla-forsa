const mongoose = require('mongoose');

// The global Panier: a shared buying batch a broker fills via one compte acheteur,
// which can carry items for several clients at once (see ClientPanier for the
// per-client breakdown of what's owed/paid within - or independent of - a given batch).
const orderSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: () => `Panier ${new Date().toLocaleDateString('fr-FR')}`,
  },
  screenshots: [{
    type: String,
  }],
  nombreArticles: {
    type: Number,
    default: 0,
  },
  compteAcheteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BuyerAccount',
  },
  nombreColis: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Open', 'Ordered', 'Closed'],
    default: 'Open',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('OrderSession', orderSessionSchema);
