const articleColors = {
  Ordered:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Confirmed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Shipped:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'In Colis':'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  Arrived:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  Delivered: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
};

const colisColors = {
  Pending:             'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
  'In Transit':        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Arrived at Carrier':'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Picked Up':         'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'In Stock':          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const paymentColors = {
  'Pending':          'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900',
  'Partially Paid':   'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900',
  'Fully Paid':       'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900',
};

const colorMaps = {
  article: articleColors,
  colis: colisColors,
  payment: paymentColors,
};

/**
 * Displays a colored status pill.
 * @param {string} status - The status string.
 * @param {'article'|'colis'|'payment'} type - Which color map to use.
 */
export default function StatusBadge({ status, type = 'article', className = '' }) {
  const map = colorMaps[type] ?? articleColors;
  const color = map[status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${color} ${className}`}>
      {status}
    </span>
  );
}
