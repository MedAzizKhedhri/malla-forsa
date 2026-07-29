const ClientPanier = require('../models/ClientPanier');

exports.getClientPaniers = async (req, res) => {
  try {
    const filters = {};
    if (req.query.client) filters.client = req.query.client;
    if (req.query.panier) filters.panier = req.query.panier;

    const clientPaniers = await ClientPanier.find(filters)
      .populate('client', 'name phone')
      .populate('panier', 'name status')
      .sort({ createdAt: -1 });
    res.json(clientPaniers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClientPanierById = async (req, res) => {
  try {
    const clientPanier = await ClientPanier.findById(req.params.id)
      .populate('client', 'name phone')
      .populate('panier', 'name status');
    if (!clientPanier) return res.status(404).json({ message: 'ClientPanier not found' });
    res.json(clientPanier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createClientPanier = async (req, res) => {
  try {
    const clientPanier = new ClientPanier(req.body);
    const saved = await clientPanier.save();
    const populated = await saved.populate([
      { path: 'client', select: 'name phone' },
      { path: 'panier', select: 'name status' },
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateClientPanier = async (req, res) => {
  try {
    const clientPanier = await ClientPanier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('client', 'name phone').populate('panier', 'name status');
    if (!clientPanier) return res.status(404).json({ message: 'ClientPanier not found' });
    res.json(clientPanier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const clientPanier = await ClientPanier.findById(req.params.id);

    if (!clientPanier) return res.status(404).json({ message: 'ClientPanier not found' });

    clientPanier.paymentHistory.push({ amount, method });

    const totalPaid = clientPanier.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = clientPanier.estimatedAmountTnd + clientPanier.insuranceFee;

    if (totalPaid >= totalDue) {
      clientPanier.paymentStatus = 'Fully Paid';
    } else if (totalPaid > 0) {
      clientPanier.paymentStatus = 'Partially Paid';
    }

    const saved = await clientPanier.save();
    const populated = await saved.populate([
      { path: 'client', select: 'name phone' },
      { path: 'panier', select: 'name status' },
    ]);
    res.json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteClientPanier = async (req, res) => {
  try {
    const clientPanier = await ClientPanier.findByIdAndDelete(req.params.id);
    if (!clientPanier) return res.status(404).json({ message: 'ClientPanier not found' });
    res.json({ message: 'ClientPanier removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
