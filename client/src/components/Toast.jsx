import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="shrink-0 text-emerald-400" size={20} />,
  error: <XCircle className="shrink-0 text-red-400" size={20} />,
  info: <Info className="shrink-0 text-blue-400" size={20} />,
};

const bars = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

export default function Toast({ toasts, dismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3 min-w-[280px] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300 relative overflow-hidden"
        >
          {/* colour bar on left */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${bars[t.type]}`} />
          <div className="pl-2 flex items-start gap-3 flex-1">
            {icons[t.type]}
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">
              {t.message}
            </p>
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
