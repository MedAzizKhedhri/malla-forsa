const CarteCadeau = require('../models/CarteCadeau');

// @desc    Get all carte cadeaux (non-deleted)
// @route   GET /api/carte-cadeaux
exports.getCarteCadeaux = async (req, res) => {
  try {
    const cartes = await CarteCadeau.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.json(cartes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a carte cadeau
// @route   POST /api/carte-cadeaux
exports.createCarteCadeau = async (req, res) => {
  try {
    const { numero, code, montant, devise } = req.body;
    const carte = new CarteCadeau({ numero, code, montant, devise });
    const saved = await carte.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a carte cadeau (including montant)
// @route   PUT /api/carte-cadeaux/:id
exports.updateCarteCadeau = async (req, res) => {
  try {
    const { numero, code, montant, devise } = req.body;
    const carte = await CarteCadeau.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { numero, code, montant, devise },
      { new: true, runValidators: true }
    );
    if (!carte) return res.status(404).json({ message: 'Carte cadeau introuvable' });
    res.json(carte);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Soft-delete a carte cadeau
// @route   DELETE /api/carte-cadeaux/:id
exports.deleteCarteCadeau = async (req, res) => {
  try {
    const carte = await CarteCadeau.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!carte) return res.status(404).json({ message: 'Carte cadeau introuvable' });
    res.json({ message: 'Carte cadeau supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
