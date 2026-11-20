import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import EmptyState from '../components/EmptyState';
import { STORE_LABELS, COUNTRY_LABELS } from '../lib/promo';
import { BadgePercent, Copy, ExternalLink, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

const STORE_FILTERS = [['', 'Tous'], ['shein', 'Shein'], ['zalando', 'Zalando']];
const COUNTRY_FILTERS = [['', 'Tous pays'], ['it', '🇮🇹 Italie'], ['fr', '🇫🇷 France'], ['all', '🌍 Sans pays']];

const notifyBell = () => window.dispatchEvent(new Event('promo-codes-changed'));
const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const formatDateTime = (d) => new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Promo codes found on coupon websites by the server's watcher. Opening this
// page marks every code as seen, which clears the bell; codes that were new
// keep a "Nouveau" badge until the page is left.
export default function PromoCodes() {
  const toast = useAppToast();
  const [codes, setCodes] = useState([]);
  const [newIds, setNewIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [store, setStore] = useState('');
  const [country, setCountry] = useState('');

  // Fetches the codes and marks the unseen ones as seen (clears the bell)
  const fetchCodes = async () => {
    const res = await api.get('/promo-codes');
    const unseen = res.data.filter(c => !c.seen).map(c => c._id);
    if (unseen.length) {
      await api.put('/promo-codes/seen', { ids: unseen });
      notifyBell();
    }
    return { codes: res.data, unseen };
  };

  const load = () =>
    fetchCodes()
      .then(({ codes, unseen }) => {
        setCodes(codes);
        if (unseen.length) setNewIds(prev => new Set([...prev, ...unseen]));
      })
      .catch(() => toast.error('Impossible de charger les codes promo.'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    api.get('/promo-codes/status').then(res => setLastRun(res.data.lastRun)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkNow = async () => {
    setChecking(true);
    try {
      const res = await api.post('/promo-codes/check', {}, { timeout: 120000 });
      setLastRun(res.data);
      toast.success(res.data.added ? `${res.data.added} nouveau(x) code(s) trouvé(s) !` : 'Aucun nouveau code.');
      await load();
    } catch {
      toast.error('La vérification a échoué.');
    } finally {
      setChecking(false);
    }
  };

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Code ${code} copié.`);
    } catch {
      toast.error('Copie impossible.');
    }
  };

  const filtered = useMemo(
    () => codes.filter(c => (!store || c.store === store) && (!country || c.country === country)),
    [codes, store, country]
  );
  const failedSources = (lastRun?.sources || []).filter(s => s.error);

  const pill = (active) =>
    `px-3 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
      active
        ? 'bg-indigo-600 text-white'
        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Codes Promo</h1>
          <p className="text-sm text-slate-500 mt-1">
            Codes Shein et Zalando (Italie, France) trouvés automatiquement sur les sites de coupons. À tester avant de compter dessus.
          </p>
          {lastRun?.finishedAt && (
            <p className="text-xs text-slate-400 mt-1">Dernière vérification : {formatDateTime(lastRun.finishedAt)}</p>
          )}
        </div>
        <button
          onClick={checkNow}
          disabled={checking}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer shrink-0"
        >
          {checking ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          {checking ? 'Vérification...' : 'Vérifier maintenant'}
        </button>
      </div>

      {failedSources.length > 0 && (
        <div className="flex gap-2 items-start rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <span>
            Sources indisponibles lors de la dernière vérification :{' '}
            {failedSources.map(s => `${s.source} (${STORE_LABELS[s.store]} ${s.country.toUpperCase()})`).join(', ')}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STORE_FILTERS.map(([v, label]) => (
          <button key={v || 'all-stores'} onClick={() => setStore(v)} className={pill(store === v)}>{label}</button>
        ))}
        <span className="w-px bg-slate-200 dark:bg-slate-800 mx-1" />
        {COUNTRY_FILTERS.map(([v, label]) => (
          <button key={v || 'all-countries'} onClick={() => setCountry(v)} className={pill(country === v)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-400" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BadgePercent}
          message={codes.length ? 'Aucun code pour ce filtre.' : 'Aucun code trouvé pour le moment. Cliquez sur « Vérifier maintenant ».'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <div
              key={c._id}
              className={`rounded-xl border bg-white dark:bg-slate-900 shadow-sm p-4 flex flex-col gap-3 ${
                newIds.has(c._id) ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-200 dark:ring-indigo-900' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{STORE_LABELS[c.store]}</span>
                <span>{COUNTRY_LABELS[c.country]}</span>
                {newIds.has(c._id) && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-indigo-600 text-white">Nouveau</span>
                )}
              </div>

              {c.code ? (
                <button
                  onClick={() => copy(c.code)}
                  title="Copier le code"
                  className="flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-2 font-mono font-bold text-lg text-indigo-700 dark:text-indigo-300 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                >
                  <span className="truncate">{c.code}</span>
                  <Copy size={16} className="shrink-0" />
                </button>
              ) : (
                <a
                  href={c.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  Code caché : le révéler sur {c.source}
                  <ExternalLink size={16} className="shrink-0" />
                </a>
              )}

              <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">{c.title}</p>

              <div className="flex items-center justify-between text-xs text-slate-400 gap-2">
                <span>{c.expiresAt ? `Expire le ${formatDate(c.expiresAt)}` : 'Sans date d’expiration'}</span>
                <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-500">
                  {c.source} <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
