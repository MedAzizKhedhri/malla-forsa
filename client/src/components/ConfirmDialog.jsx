import { Loader2, AlertTriangle } from 'lucide-react';

/**
 * Replaces window.confirm() with a non-blocking modal dialog.
 *
 * Usage:
 *   const [pending, setPending] = useState(null);
 *
 *   // trigger
 *   <button onClick={() => setPending(item)}>Supprimer</button>
 *
 *   // dialog
 *   <ConfirmDialog
 *     open={!!pending}
 *     onClose={() => setPending(null)}
 *     onConfirm={() => { setPending(null); doDelete(pending); }}
 *     title="Supprimer ?"
 *     message={`"${pending?.name}" sera supprimé.`}
 *   />
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmer la suppression',
  message,
  confirmLabel = 'Supprimer',
  loading = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={!loading ? onClose : undefined} />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">{title}</h3>
            {message && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{message}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
