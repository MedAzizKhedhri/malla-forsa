const Colis = require('../models/Colis');

exports.getColis = async (req, res) => {
  try {
    const filters = { isDeleted: false };
    if (req.query.panier) filters.panier = req.query.panier;

    const colisList = await Colis.find(filters)
      .populate('panier', 'name')
      .populate('clients', 'name')
      .sort({ createdAt: -1 });

    res.json(colisList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getColisById = async (req, res) => {
  try {
    const colis = await Colis.findOne({ _id: req.params.id, isDeleted: false })
      .populate('panier', 'name')
      .populate('clients', 'name');
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
    const colis = await Colis.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    ).populate('panier', 'name').populate('clients', 'name');
    if (!colis) return res.status(404).json({ message: 'Colis not found' });
    res.json(colis);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteColis = async (req, res) => {
  try {
    const colis = await Colis.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!colis) return res.status(404).json({ message: 'Colis not found' });
    res.json({ message: 'Colis removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
