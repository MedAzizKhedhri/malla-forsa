const Client = require('../models/Client');
const ClientPanier = require('../models/ClientPanier');

exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find().populate('compteAcheteur', 'label').sort({ createdAt: -1 });

    const enriched = await Promise.all(clients.map(async (client) => {
      const clientPaniers = await ClientPanier.find({ client: client._id });
      const totalDue = clientPaniers.reduce((sum, cp) => sum + cp.estimatedAmountTnd + cp.insuranceFee, 0);
      const totalPaid = clientPaniers.reduce(
        (sum, cp) => sum + cp.paymentHistory.reduce((a, p) => a + p.amount, 0),
        0
      );
      return {
        ...client._doc,
        totalDue,
        totalPaid,
        totalReste: totalDue - totalPaid,
        panierCount: clientPaniers.length,
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('compteAcheteur', 'label');
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { name, phone, contactInfo, nombreArticles, compteAcheteur } = req.body;
    const client = new Client({ name, phone, contactInfo, nombreArticles, compteAcheteur: compteAcheteur || undefined });
    const savedClient = await client.save();
    res.status(201).json(savedClient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { name, phone, contactInfo, nombreArticles, compteAcheteur } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { name, phone, contactInfo, nombreArticles, compteAcheteur: compteAcheteur || undefined },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
