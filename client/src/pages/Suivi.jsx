import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { whatsappNumber, whatsappLink } from '../lib/whatsapp';
import { Loader2, ShoppingBag, Search, Check, X, MessageCircle, ImageIcon, Link2, ArrowLeft } from 'lucide-react';

const inputClass = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500';

// What the client reads for each status the admin can set
const STATUS_INFO = {
  new: {
    title: 'Demande reçue',
    text: 'Nous allons la consulter et vous contacter très bientôt.',
  },
  contacted: {
    title: 'Nous vous avons contacté',
    text: 'Nous avons pris contact avec vous. Si vous n\'avez rien reçu, écrivez-nous.',
  },
  accepted: {
    title: 'Demande acceptée',
    text: 'Votre commande est prise en charge. Nous reviendrons vers vous pour les prochaines étapes.',
  },
  rejected: {
    title: 'Demande refusée',
    text: 'Nous ne pouvons malheureusement pas donner suite à cette demande.',
  },
};

const STEPS = [
  { key: 'new', label: 'Reçue' },
  { key: 'contacted', label: 'Contactée' },
  { key: 'accepted', label: 'Acceptée' },
];

const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', {
  day: 'numeric', month: 'long', year: 'numeric',
});

function Timeline({ status }) {
  const rejected = status === 'rejected';
  const reached = STEPS.findIndex(s => s.key === status);
  // A rejected request stops after "Reçue": the last step turns into "Refusée"
  const steps = rejected
    ? [STEPS[0], { key: 'rejected', label: 'Refusée' }]
    : STEPS;

  return (
    <ol className="flex items-start">
      {steps.map((step, index) => {
        const isRejectedStep = step.key === 'rejected';
        const done = isRejectedStep || (!rejected && index <= reached) || (rejected && index === 0);
        return (
          <li key={step.key} className="flex-1 flex flex-col items-center relative">
            {index > 0 && (
              <span className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${done ? (isRejectedStep ? 'bg-red-400' : 'bg-emerald-400') : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
            <span className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white ${
              done ? (isRejectedStep ? 'bg-red-500' : 'bg-emerald-500') : 'bg-slate-200 dark:bg-slate-700'
            }`}>
              {done && (isRejectedStep ? <X size={16} strokeWidth={3} /> : <Check size={16} strokeWidth={3} />)}
            </span>
            <span className={`mt-1.5 text-xs font-semibold ${done ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function Suivi() {
  const [searchParams] = useSearchParams();
  const [reference, setReference] = useState(searchParams.get('ref') || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post('/public/requests/status', { reference, phone });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const info = result ? STATUS_INFO[result.status] || STATUS_INFO.new : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-2">
          <ShoppingBag className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tighter">
            Malla Forssa
          </h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Suivre ma demande</h2>
          <p className="text-sm text-slate-500 mt-1">
            Entrez votre référence et le numéro de téléphone utilisé pour la demande.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Référence *</label>
            <input
              required
              type="text"
              autoCapitalize="characters"
              placeholder="ex: SH-0042"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Numéro de téléphone *</label>
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="ex: 22 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search size={16} />}
            Voir le statut
          </button>
        </form>

        {result && (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-wider text-slate-400">{result.reference}</p>
                <p className="font-bold">{result.name}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>Envoyée le {formatDate(result.createdAt)}</p>
                <p className="flex items-center justify-end gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><ImageIcon size={12} /> {result.imageCount}</span>
                  <span className="flex items-center gap-1"><Link2 size={12} /> {result.itemCount}</span>
                </p>
              </div>
            </div>

            <Timeline status={result.status} />

            <div className={`rounded-xl px-4 py-3 ${
              result.status === 'rejected'
                ? 'bg-red-50 dark:bg-red-950/30'
                : result.status === 'accepted'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30'
                  : 'bg-slate-100 dark:bg-slate-800'
            }`}>
              <p className="font-bold">{info.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{info.text}</p>
              {result.rejectionReason && (
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                  <span className="font-semibold">Motif :</span> {result.rejectionReason}
                </p>
              )}
              {result.updatedAt && result.status !== 'new' && (
                <p className="text-xs text-slate-400 mt-2">Mise à jour le {formatDate(result.updatedAt)}</p>
              )}
            </div>

            {whatsappNumber && (
              <a
                href={whatsappLink(`Bonjour, je vous écris au sujet de ma demande ${result.reference}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
              >
                <MessageCircle size={18} /> Nous écrire sur WhatsApp
              </a>
            )}
          </section>
        )}

        <Link to="/demande" className="flex items-center justify-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          <ArrowLeft size={14} /> Faire une nouvelle demande
        </Link>
      </main>
    </div>
  );
}
