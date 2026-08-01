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
  devise: {
    type: String,
    enum: ['EUR', 'USD'],
    default: 'EUR',
  },
  arrivage: {
    type: String,
    trim: true,
    default: '',
  },
  // Rate (1 unit of `devise` -> TND) captured at creation time, so historical
  // profit stays stable even as the live rate moves later.
  exchangeRateToTnd: {
    type: Number,
  },
  // Optional: a carte cadeau used (alongside or instead of cash) to pay for this panier.
  carteCadeauUtilisee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CarteCadeau',
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
