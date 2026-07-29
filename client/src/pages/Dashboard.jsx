import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import {
  Mail, Loader2, Package, AlertCircle, Users,
  ShoppingCart, TrendingUp, ArrowRight, Coins, AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const toast = useAppToast();
  const [stats, setStats] = useState({
    clients: 0,
    clientsEnDette: 0,
    totalPaye: 0,
    resteARecevoir: 0,
    nombrePaniers: 0,
    colisTransit: 0,
    pendingEmails: 0,
  });
  const [recentPaniers, setRecentPaniers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [clientsRes, ordersRes, colisRes, emailsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/order-sessions'),
        api.get('/colis'),
        api.get('/emails/logs'),
      ]);

      const clients = clientsRes.data;
      const paniers = ordersRes.data;

      setRecentPaniers([...paniers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));

      setStats({
        clients: clients.length,
        clientsEnDette: clients.filter((c) => c.totalReste > 0).length,
        totalPaye: clients.reduce((sum, c) => sum + (c.totalPaid || 0), 0),
        resteARecevoir: clients.reduce((sum, c) => sum + (c.totalReste || 0), 0),
        nombrePaniers: paniers.length,
        colisTransit: colisRes.data.filter((c) => c.status === 'In Transit' || c.status === 'Arrived at Carrier').length,
        pendingEmails: emailsRes.data.filter((e) => e.status === 'Action Required').length,
      });
    } catch {
      toast.error('Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Clients',
      value: stats.clients,
      icon: <Users className="h-6 w-6" />,
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      text: 'text-indigo-600 dark:text-indigo-400',
      href: '/clients',
    },
    {
      label: 'Clients en Dette',
      value: stats.clientsEnDette,
      icon: <AlertTriangle className="h-6 w-6" />,
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      href: '/clients',
    },
    {
      label: 'Total Payé (TND)',
      value: stats.totalPaye.toLocaleString(),
      icon: <Coins className="h-6 w-6" />,
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      href: '/clients',
    },
    {
      label: 'Reste à Recevoir (TND)',
      value: stats.resteARecevoir.toLocaleString(),
      icon: <AlertCircle className="h-6 w-6" />,
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-600 dark:text-amber-400',
      href: '/clients',
    },
    {
      label: 'Nombre de Paniers',
      value: stats.nombrePaniers,
      icon: <ShoppingCart className="h-6 w-6" />,
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      href: '/paniers',
    },
    {
      label: 'Colis en Transit',
      value: stats.colisTransit,
      icon: <Package className="h-6 w-6" />,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      href: '/colis',
    },
    {
      label: 'Actions Email',
      value: stats.pendingEmails,
      icon: <Mail className="h-6 w-6" />,
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      text: 'text-rose-600 dark:text-rose-400',
      href: '/emails',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 text-white p-8 shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/30" />
          <div className="absolute -left-8 -bottom-8 w-48 h-48 rounded-full bg-white/20" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-indigo-200" />
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Tableau de Bord</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Malla Forssa</h1>
          <p className="text-indigo-100 text-sm max-w-lg">
            Gérez vos importations EU → Tunisie depuis une interface unique. Suivez les paniers, colis, paiements et emails acheteurs.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              to="/paniers"
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-lg transition-all border border-white/20 flex items-center gap-1.5"
            >
              <ShoppingCart size={14} /> Nouveau Panier
            </Link>
            <Link
              to="/clients"
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-lg transition-all border border-white/20 flex items-center gap-1.5"
            >
              <Users size={14} /> Gérer les Clients
            </Link>
            <Link
              to="/colis"
              className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-lg transition-all border border-white/20 flex items-center gap-1.5"
            >
              <Package size={14} /> Suivre les Colis
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => (
            <Link
              key={card.label}
              to={card.href}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 transition-all hover:shadow-md hover:-translate-y-0.5 group flex items-center gap-5"
            >
              <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center ${card.text} shrink-0 transition-transform group-hover:scale-105`}>
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {card.label}
                </p>
                <p className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {card.value}
                </p>
              </div>
              <ArrowRight size={16} className="text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* Recent Paniers */}
      {!loading && recentPaniers.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Paniers Récents</h2>
            <Link
              to="/paniers"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentPaniers.map((panier) => {
              const clientNames = (panier.clients || []).map((c) => c.name);
              return (
                <div key={panier._id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 shrink-0">
                    <ShoppingCart size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-slate-800 dark:text-slate-100">{panier.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {clientNames.length > 0 ? clientNames.join(', ') : 'Aucun client rattaché'} · {panier.nombreColis || 0} colis · {panier.nombreArticles || 0} articles
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {(panier.totalPrice || 0).toLocaleString()} €
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
