import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Full-screen click-to-enlarge image viewer.
 * Closes on backdrop click and Escape key. Renders above any open Modal.
 */
export default function Lightbox({ src, onClose }) {
  useEffect(() => {
    if (!src) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        title="Fermer"
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt="Capture agrandie"
        className="relative max-w-full max-h-full object-contain rounded-lg shadow-2xl"
      />
    </div>
  );
}
