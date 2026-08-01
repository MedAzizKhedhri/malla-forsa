import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import { TrendingUp, Loader2, Coins, AlertTriangle, Search, Package } from 'lucide-react';

function fmt(n) {
  return (n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function ProfitValue({ value }) {
  const positive = value >= 0;
  return (
    <span className={positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
      {positive ? '+' : ''}{fmt(value)} TND
    </span>
  );
}

export default function Stats() {
  const toast = useAppToast();
  const [tab, setTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const [arrivages, setArrivages] = useState([]);
  const [loadingArrivages, setLoadingArrivages] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOverview();
    fetchArrivages();
  }, []);

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await api.get('/stats/overview');
      setOverview(res.data);
    } catch {
      toast.error('Impossible de charger la vue générale.');
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchArrivages = async () => {
    setLoadingArrivages(true);
    try {
      const res = await api.get('/stats/arrivages');
      setArrivages(res.data);
    } catch {
      toast.error('Impossible de charger les statistiques par arrivage.');
    } finally {
      setLoadingArrivages(false);
    }
  };

  const filteredArrivages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return arrivages;
    return arrivages.filter(a => a.arrivage.toLowerCase().includes(q));
  }, [arrivages, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-sm text-slate-500 mt-1">Coût, revenu et profit basés sur les taux de change réels.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('overview')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Vue Générale
        </button>
        <button
          onClick={() => setTab('arrivages')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'arrivages'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Par Arrivage
        </button>
      </div>

      {tab === 'overview' && (
        loadingOverview ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : overview && (
          <div className="space-y-4">
            {overview.incompletePanierCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
                <AlertTriangle size={16} className="shrink-0" />
                {overview.incompletePanierCount} panier{overview.incompletePanierCount !== 1 ? 's' : ''} sans taux de change enregistré — exclu{overview.incompletePanierCount !== 1 ? 's' : ''} du coût total.
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <p className="text-sm text-slate-500 mb-1">Coût total</p>
                <p className="text-2xl font-bold">{fmt(overview.totalCost)} TND</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <p className="text-sm text-slate-500 mb-1">Revenu facturé</p>
                <p className="text-2xl font-bold">{fmt(overview.totalBilledRevenue)} TND</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <p className="text-sm text-slate-500 mb-1">Revenu encaissé</p>
                <p className="text-2xl font-bold">{fmt(overview.totalCollectedRevenue)} TND</p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <p className="text-sm text-slate-500 mb-1">{overview.panierCount} panier{overview.panierCount !== 1 ? 's' : ''}</p>
                <p className="text-sm flex items-center gap-1.5"><Package size={14} className="text-slate-400" /> au total</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <p className="text-sm text-slate-500 mb-1">Profit (facturé)</p>
                <p className="text-2xl font-bold"><ProfitValue value={overview.totalProfitBilled} /></p>
              </div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
                <p className="text-sm text-slate-500 mb-1">Profit (encaissé)</p>
                <p className="text-2xl font-bold"><ProfitValue value={overview.totalProfitCollected} /></p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Coins size={16} className="text-emerald-500" /> Taux actuel</h3>
              <p className="text-xs text-slate-500 mb-3">N'affecte pas les paniers déjà créés — chaque panier conserve le taux enregistré à sa création.</p>
              <div className="flex gap-6 text-sm">
                <span>1 EUR = <span className="font-semibold">{overview.currentRates.EUR != null ? fmt(overview.currentRates.EUR) : 'N/A'}</span> TND</span>
                <span>1 USD = <span className="font-semibold">{overview.currentRates.USD != null ? fmt(overview.currentRates.USD) : 'N/A'}</span> TND</span>
              </div>
            </div>
          </div>
        )
      )}

      {tab === 'arrivages' && (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrer par arrivage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {loadingArrivages ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : filteredArrivages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-16 text-center text-slate-500">
              Aucun arrivage trouvé.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredArrivages.map((a) => (
                <div key={a.arrivage} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp size={18} className="text-indigo-500" /> {a.arrivage}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                      {a.panierCount} panier{a.panierCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {a.incompleteData && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                      <AlertTriangle size={13} className="shrink-0" /> Taux de change manquant pour certains paniers de ce lot.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <span className="text-slate-500">Coût</span><span className="font-semibold text-right">{fmt(a.cost)} TND</span>
                    <span className="text-slate-500">Revenu facturé</span><span className="font-semibold text-right">{fmt(a.billedRevenue)} TND</span>
                    <span className="text-slate-500">Revenu encaissé</span><span className="font-semibold text-right">{fmt(a.collectedRevenue)} TND</span>
                    <span className="text-slate-500">Profit (facturé)</span><span className="font-semibold text-right"><ProfitValue value={a.profitBilled} /></span>
                    <span className="text-slate-500">Profit (encaissé)</span><span className="font-semibold text-right"><ProfitValue value={a.profitCollected} /></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
