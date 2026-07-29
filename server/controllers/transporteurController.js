const Transporteur = require('../models/Transporteur');

exports.getTransporteurs = async (req, res) => {
  try {
    const transporteurs = await Transporteur.find().sort({ name: 1 });
    res.json(transporteurs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTransporteur = async (req, res) => {
  try {
    const transporteur = new Transporteur(req.body);
    const saved = await transporteur.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTransporteur = async (req, res) => {
  try {
    const transporteur = await Transporteur.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!transporteur) return res.status(404).json({ message: 'Transporteur not found' });
    res.json(transporteur);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTransporteur = async (req, res) => {
  try {
    const transporteur = await Transporteur.findByIdAndDelete(req.params.id);
    if (!transporteur) return res.status(404).json({ message: 'Transporteur not found' });
    res.json({ message: 'Transporteur removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
