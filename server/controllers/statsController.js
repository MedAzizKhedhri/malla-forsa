const OrderSession = require('../models/OrderSession');
const ClientPanier = require('../models/ClientPanier');
const { getRate } = require('../utils/fxRate');

// cost = totalPrice (in the panier's own currency) converted to TND using the
// rate stored on the panier at creation time. Paniers missing a stored rate
// contribute 0 to cost and mark the group/total as having incomplete data.
function costOf(session) {
  if (!session.exchangeRateToTnd) return { cost: 0, incomplete: true };
  return { cost: (session.totalPrice || 0) * session.exchangeRateToTnd, incomplete: false };
}

function revenueOf(clientPaniers) {
  let billedRevenue = 0;
  let collectedRevenue = 0;
  clientPaniers.forEach((cp) => {
    billedRevenue += cp.estimatedAmountTnd || 0;
    (cp.paymentHistory || []).forEach((p) => { collectedRevenue += p.amount || 0; });
  });
  return { billedRevenue, collectedRevenue };
}

// @desc    Per-arrivage cost/revenue/profit
// @route   GET /api/stats/arrivages
exports.getArrivageStats = async (req, res) => {
  try {
    const sessions = await OrderSession.find();

    const groups = {};
    sessions.forEach((s) => {
      const key = s.arrivage && s.arrivage.trim() ? s.arrivage.trim() : '(Sans arrivage)';
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    const allClientPaniers = await ClientPanier.find({ panier: { $in: sessions.map(s => s._id) } });
    const clientPaniersByPanier = {};
    allClientPaniers.forEach((cp) => {
      const key = String(cp.panier);
      if (!clientPaniersByPanier[key]) clientPaniersByPanier[key] = [];
      clientPaniersByPanier[key].push(cp);
    });

    const result = Object.entries(groups).map(([arrivage, group]) => {
      let cost = 0;
      let incompleteData = false;
      group.forEach((s) => {
        const { cost: c, incomplete } = costOf(s);
        cost += c;
        if (incomplete) incompleteData = true;
      });

      const groupClientPaniers = group.flatMap((s) => clientPaniersByPanier[String(s._id)] || []);
      const { billedRevenue, collectedRevenue } = revenueOf(groupClientPaniers);

      return {
        arrivage,
        panierCount: group.length,
        cost,
        billedRevenue,
        collectedRevenue,
        profitBilled: billedRevenue - cost,
        profitCollected: collectedRevenue - cost,
        incompleteData,
      };
    });

    result.sort((a, b) => a.arrivage.localeCompare(b.arrivage));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    General cash-flow overview across all paniers
// @route   GET /api/stats/overview
exports.getOverviewStats = async (req, res) => {
  try {
    const sessions = await OrderSession.find();
    const clientPaniers = await ClientPanier.find({ panier: { $in: sessions.map(s => s._id) } });

    let totalCost = 0;
    let incompletePanierCount = 0;
    sessions.forEach((s) => {
      const { cost, incomplete } = costOf(s);
      totalCost += cost;
      if (incomplete) incompletePanierCount += 1;
    });

    const { billedRevenue, collectedRevenue } = revenueOf(clientPaniers);

    let currentRates = { EUR: null, USD: null };
    try {
      const [eur, usd] = await Promise.all([getRate('EUR'), getRate('USD')]);
      currentRates = { EUR: eur, USD: usd };
    } catch {
      // Leave currentRates as null if the FX API is unreachable and no cache exists yet
    }

    res.json({
      totalCost,
      totalBilledRevenue: billedRevenue,
      totalCollectedRevenue: collectedRevenue,
      totalProfitBilled: billedRevenue - totalCost,
      totalProfitCollected: collectedRevenue - totalCost,
      currentRates,
      panierCount: sessions.length,
      incompletePanierCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
