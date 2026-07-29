const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  method: {
    type: String,
    trim: true,
  },
});

// A client's own order: what they asked for, what they owe, what they've paid.
// Distinct from the global Panier (OrderSession), which is the shared buying batch
// a broker fills from one or more compte acheteur - a Panier can carry several
// clients' ClientPaniers at once, and a client can have several ClientPaniers over time.
const clientPanierSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  panier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrderSession',
  },
  colis: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Colis',
  },
  screenshots: [{
    type: String,
  }],
  name: {
    type: String,
    trim: true,
    default: () => `Commande ${new Date().toLocaleDateString('fr-FR')}`,
  },
  nombreArticles: {
    type: Number,
    default: 0,
  },
  estimatedAmountEur: {
    type: Number,
    default: 0,
  },
  estimatedAmountTnd: {
    type: Number,
    default: 0,
  },
  insuranceFee: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Fully Paid'],
    default: 'Pending',
  },
  paymentHistory: [paymentHistorySchema],
  status: {
    type: String,
    enum: ['Open', 'Ordered', 'Closed'],
    default: 'Open',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ClientPanier', clientPanierSchema);
