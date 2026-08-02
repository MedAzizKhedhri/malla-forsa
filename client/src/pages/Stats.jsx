import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import { Coins, Users, ShoppingBag, Loader2, Wallet, AlertCircle } from 'lucide-react';

function fmt(n) {
  return (n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function monthLabel(month) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(year, m - 1, 1);
  const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function Stats() {
  const toast = useAppToast();
  const [months, setMonths] = useState([]);
  const [arrivages, setArrivages] = useState([]);
  const [month, setMonth] = useState('');
  const [arrivage, setArrivage] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/filter-options')
      .then(res => {
        setMonths(res.data.months || []);
        setArrivages(res.data.arrivages || []);
      })
      .catch(() => toast.error('Impossible de charger les filtres.'));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (month) params.month = month;
    if (arrivage) params.arrivage = arrivage;
    api.get('/stats/summary', { params })
      .then(res => setSummary(res.data))
      .catch(() => toast.error('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false));
  }, [month, arrivage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-sm text-slate-500 mt-1">Sommes par devise, clients et articles.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les mois</option>
          {months.map(m => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>

        <select
          value={arrivage}
          onChange={(e) => setArrivage(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tous les arrivages</option>
          {arrivages.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Coins size={14} className="text-slate-400" /> Somme EUR</p>
            <p className="text-2xl font-bold">{fmt(summary.sommeEUR)} €</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Coins size={14} className="text-slate-400" /> Somme USD</p>
            <p className="text-2xl font-bold">{fmt(summary.sommeUSD)} $</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> Nbre de clients</p>
            <p className="text-2xl font-bold">{summary.nbreClients}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
            <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><ShoppingBag size={14} className="text-slate-400" /> Nbre d'articles</p>
            <p className="text-2xl font-bold">{summary.nbreArticles}</p>
          </div>
        </div>
      )}

      {!loading && summary && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Montants TND (commandes clients)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Wallet size={14} className="text-slate-400" /> Somme TND</p>
              <p className="text-2xl font-bold">{fmt(summary.sommeTND)} TND</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><Coins size={14} className="text-slate-400" /> Payé</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(summary.payeTND)} TND</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
              <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5"><AlertCircle size={14} className="text-slate-400" /> Total dette</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{fmt(summary.detteTND)} TND</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
