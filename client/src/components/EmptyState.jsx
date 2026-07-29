import { PackageOpen } from 'lucide-react';

/**
 * Centered empty-state placeholder used in every list page.
 * @param {string} message - Text to display.
 * @param {React.ElementType} icon - Optional icon component (lucide).
 */
export default function EmptyState({ message = 'Aucun élément trouvé.', icon: Icon = PackageOpen }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm py-16 text-center">
      <div className="flex justify-center mb-3">
        <Icon size={36} className="text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm">{message}</p>
    </div>
  );
}
