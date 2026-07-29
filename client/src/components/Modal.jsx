import { useEffect } from 'react';

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Reusable modal wrapper.
 * Closes on backdrop click and Escape key.
 */
export default function Modal({ open, onClose, children, maxWidth = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={`relative bg-white dark:bg-slate-900 rounded-2xl w-full ${widths[maxWidth]} shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
}
