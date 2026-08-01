const OrderSession = require('../models/OrderSession');
const Colis = require('../models/Colis');
const ClientPanier = require('../models/ClientPanier');
const { getRate } = require('../utils/fxRate');

exports.getOrderSessions = async (req, res) => {
  try {
    const sessions = await OrderSession.find()
      .populate('compteAcheteur', 'label email')
      .populate('carteCadeauUtilisee', 'numero code montant devise')
      .sort({ createdAt: -1 });

    // Attach a lightweight client count per panier so the list view can show
    // how many clients' orders are riding in each batch without a manual field.
    const clientPaniers = await ClientPanier.find({ panier: { $in: sessions.map(s => s._id) } })
      .populate('client', 'name');
    const byPanier = {};
    clientPaniers.forEach((cp) => {
      const key = String(cp.panier);
      if (!byPanier[key]) byPanier[key] = [];
      byPanier[key].push(cp.client);
    });

    const enriched = sessions.map((s) => ({
      ...s._doc,
      clients: byPanier[String(s._id)] || [],
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderSessionById = async (req, res) => {
  try {
    const session = await OrderSession.findById(req.params.id)
      .populate('compteAcheteur', 'label email')
      .populate('carteCadeauUtilisee', 'numero code montant devise');
    if (!session) return res.status(404).json({ message: 'OrderSession not found' });

    const colis = await Colis.find({ panier: session._id }).sort({ createdAt: 1 });
    const clientPaniers = await ClientPanier.find({ panier: session._id })
      .populate('client', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ ...session._doc, colis, clientPaniers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createOrderSession = async (req, res) => {
  try {
    const session = new OrderSession(req.body);

    // Stamp the exchange rate at creation time so historical profit stays
    // stable even as the live rate moves later (never re-stamped on update).
    if (!session.exchangeRateToTnd) {
      try {
        session.exchangeRateToTnd = await getRate(session.devise || 'EUR');
      } catch (rateError) {
        return res.status(503).json({ message: `Impossible de récupérer le taux de change, réessayez. (${rateError.message})` });
      }
    }

    const savedSession = await session.save();

    // Auto-create the panier's colis, blank and ready for the broker to fill in later
    const nombreColis = savedSession.nombreColis || 0;
    if (nombreColis > 0) {
      const colisToCreate = Array.from({ length: nombreColis }, () => ({ panier: savedSession._id }));
      await Colis.insertMany(colisToCreate);
    }

    res.status(201).json(savedSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateOrderSession = async (req, res) => {
  try {
    const session = await OrderSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!session) return res.status(404).json({ message: 'OrderSession not found' });
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteOrderSession = async (req, res) => {
  try {
    const session = await OrderSession.findByIdAndDelete(req.params.id);
    if (!session) return res.status(404).json({ message: 'OrderSession not found' });

    // Detach (rather than delete) colis and client paniers that referenced this batch
    await Colis.updateMany({ panier: session._id }, { $unset: { panier: '' } });
    await ClientPanier.updateMany({ panier: session._id }, { $unset: { panier: '' } });

    res.json({ message: 'OrderSession removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
