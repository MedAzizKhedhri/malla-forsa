import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, BadgePercent } from 'lucide-react';
import api from '../lib/api';
import { STORE_LABELS, COUNTRY_LABELS } from '../lib/promo';

// Bell with the number of new promo codes found by the watcher. Refreshes on
// every page change and every 5 minutes; the dropdown lists the latest ones.
export default function NotificationBell({ align = 'left' }) {
  const location = useLocation();
  const [data, setData] = useState({ count: 0, latest: [] });
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const load = () => api.get('/promo-codes/notifications').then(res => setData(res.data)).catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    // The Codes Promo page fires this after marking codes as seen or checking now
    window.addEventListener('promo-codes-changed', load);
    return () => {
      clearInterval(id);
      window.removeEventListener('promo-codes-changed', load);
    };
  }, [location.pathname]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={data.count ? `${data.count} nouveaux codes promo` : 'Notifications'}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
      >
        <Bell size={20} />
        {data.count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {data.count > 99 ? '99+' : data.count}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute top-full mt-2 ${align === 'right' ? 'right-0' : 'left-0'} z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden`}>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-bold">
            Nouveaux codes promo
          </div>
          {data.latest.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">Aucun nouveau code pour le moment.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {data.latest.map(p => (
                <li key={p._id} className="px-4 py-3 flex gap-3">
                  <BadgePercent size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500">
                      {STORE_LABELS[p.store]} · {COUNTRY_LABELS[p.country]}
                    </p>
                    <p className="text-sm font-mono font-bold truncate">{p.code || 'Code à révéler'}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{p.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/codes-promo"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            Voir tous les codes
          </Link>
        </div>
      )}
    </div>
  );
}
