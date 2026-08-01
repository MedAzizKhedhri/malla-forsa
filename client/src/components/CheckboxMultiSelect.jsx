import { Check } from 'lucide-react';

/**
 * Bordered, scrollable checkbox list for selecting multiple items — the
 * multi-select counterpart to the plain native <select> used everywhere
 * else in the app.
 */
export default function CheckboxMultiSelect({ options, selectedIds, onChange, getLabel, getId, emptyLabel = 'Aucune option disponible.' }) {
  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  };

  if (options.length === 0) {
    return (
      <div className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-4 text-sm text-slate-500 text-center">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="w-full max-h-56 overflow-y-auto rounded-lg border border-slate-300 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
      {options.map((option) => {
        const id = getId(option);
        const checked = selectedIds.includes(id);
        return (
          <label
            key={id}
            className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
              checked
                ? 'bg-indigo-600 border-indigo-600'
                : 'border-slate-300 dark:border-slate-600'
            }`}>
              {checked && <Check size={11} className="text-white" strokeWidth={3} />}
            </span>
            <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="hidden" />
            {getLabel(option)}
          </label>
        );
      })}
    </div>
  );
}
