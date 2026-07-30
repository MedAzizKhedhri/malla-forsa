const mongoose = require('mongoose');

const carteCadeauSchema = new mongoose.Schema({
  numero: {
    type: String,
    required: [true, 'Le numéro de carte est requis'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Le code est requis'],
    trim: true,
  },
  montant: {
    type: Number,
    required: [true, 'Le montant est requis'],
    min: [0, 'Le montant ne peut pas être négatif'],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CarteCadeau', carteCadeauSchema);
