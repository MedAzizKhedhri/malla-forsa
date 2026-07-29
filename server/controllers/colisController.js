const Colis = require('../models/Colis');

exports.getColis = async (req, res) => {
  try {
    const filters = {};
    if (req.query.panier) filters.panier = req.query.panier;

    const colisList = await Colis.find(filters)
      .populate('panier', 'name')
      .sort({ createdAt: -1 });

    res.json(colisList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getColisById = async (req, res) => {
  try {
    const colis = await Colis.findById(req.params.id).populate('panier', 'name');
    if (!colis) return res.status(404).json({ message: 'Colis not found' });
    res.json(colis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createColis = async (req, res) => {
  try {
    const colis = new Colis(req.body);
    const savedColis = await colis.save();
    res.status(201).json(savedColis);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateColis = async (req, res) => {
  try {
    const colis = await Colis.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('panier', 'name');
    if (!colis) return res.status(404).json({ message: 'Colis not found' });
    res.json(colis);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteColis = async (req, res) => {
  try {
    const colis = await Colis.findByIdAndDelete(req.params.id);
    if (!colis) return res.status(404).json({ message: 'Colis not found' });
    res.json({ message: 'Colis removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
