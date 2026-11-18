import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { whatsappNumber, whatsappLink } from '../lib/whatsapp';
import { Loader2, Plus, X, ImageIcon, ShoppingBag, CheckCircle2, MessageCircle, Link2, Phone, MessageSquare, Search } from 'lucide-react';

const MAX_IMAGES = 10;
const MAX_ITEMS = 10;

const inputClass = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500';
const emptyItem = () => ({ link: '', details: '' });

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

export default function PublicRequest() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    note: '',
    contactPref: 'whatsapp',
    website: '', // honeypot, real visitors never see it
  });
  const [items, setItems] = useState([emptyItem()]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const updateItem = (index, key, value) => {
    setItems(prev => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const handleUpload = async (e) => {
    const files = [...(e.target.files || [])].slice(0, MAX_IMAGES - images.length);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    setError('');
    const results = await Promise.allSettled(files.map(file => {
      const data = new FormData();
      data.append('image', file);
      return api.post('/public/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }));
    const urls = results.filter(r => r.status === 'fulfilled').map(r => r.value.data.url);
    const failed = results.find(r => r.status === 'rejected');
    if (failed) setError(errorMessage(failed.reason, 'Une photo n\'a pas pu être envoyée.'));
    setImages(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/public/requests', { ...form, items, images });
      setReference(res.data.reference);
    } catch (err) {
      setError(errorMessage(err, 'Une erreur est survenue, réessayez.'));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm({ name: '', phone: '', note: '', contactPref: 'whatsapp', website: '' });
    setItems([emptyItem()]);
    setImages([]);
    setReference('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-16">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-2">
          <ShoppingBag className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
          <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tighter">
            Malla Forssa
          </h1>
          <Link
            to="/suivi"
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Search size={14} /> Suivre ma demande
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6">
        {reference ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold">Demande envoyée !</h2>
            <p className="text-sm text-slate-500">
              Nous vous contacterons très vite{form.contactPref === 'call' ? ' par téléphone' : ' sur WhatsApp'}.
            </p>
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800 py-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Votre référence</p>
              <p className="text-2xl font-black tracking-wider mt-0.5">{reference}</p>
            </div>
            {whatsappNumber && (
              <a
                href={whatsappLink(`Bonjour, je viens d'envoyer la demande ${reference}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
              >
                <MessageCircle size={18} /> Nous écrire sur WhatsApp
              </a>
            )}
            <p className="text-xs text-slate-500">
              Gardez cette référence : elle vous permet de suivre l'avancement de votre demande.
            </p>
            <div className="flex flex-col items-center gap-2">
              <Link
                to={`/suivi?ref=${encodeURIComponent(reference)}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Search size={14} /> Suivre ma demande
              </Link>
              <button onClick={reset} className="text-sm font-semibold text-slate-500 hover:underline cursor-pointer">
                Envoyer une autre demande
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Commander sur Shein</h2>
              <p className="text-sm text-slate-500 mt-1">
                Envoyez-nous les articles que vous voulez, nous nous occupons du reste.
              </p>
            </div>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  required
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
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
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Comment vous contacter ?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                    { key: 'call', label: 'Appel', icon: Phone },
                  ].map(opt => {
                    const Icon = opt.icon;
                    const active = form.contactPref === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setField('contactPref', opt.key)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <Icon size={16} /> {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-3">
              <div>
                <h3 className="font-bold flex items-center gap-2"><Link2 size={16} className="text-slate-400" /> Liens Shein</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Collez le lien de chaque article (ou le message du bouton « Partager » de Shein).
                </p>
              </div>
              {items.map((item, index) => (
                <div key={index} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="url"
                      placeholder="https://shein.com/..."
                      value={item.link}
                      onChange={(e) => updateItem(index, 'link', e.target.value)}
                      className={inputClass}
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                        title="Retirer cet article"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Taille, couleur, quantité (optionnel)"
                    value={item.details}
                    onChange={(e) => updateItem(index, 'details', e.target.value)}
                    className={inputClass}
                  />
                </div>
              ))}
              {items.length < MAX_ITEMS && (
                <button
                  type="button"
                  onClick={() => setItems(prev => [...prev, emptyItem()])}
                  className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <Plus size={16} /> Ajouter un autre article
                </button>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 space-y-3">
              <div>
                <h3 className="font-bold flex items-center gap-2"><ImageIcon size={16} className="text-slate-400" /> Photos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Captures d'écran ou photos des articles ({images.length}/{MAX_IMAGES}). Il faut au moins une photo ou un lien.
                </p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map(url => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={url} alt="Article" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter(u => u !== url))}
                      className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all text-xs text-slate-500 text-center ${uploading ? 'pointer-events-none' : 'cursor-pointer'}`}>
                    {uploading ? <Loader2 size={20} className="animate-spin text-indigo-500" /> : <ImageIcon size={20} className="text-slate-400" />}
                    {uploading ? 'Envoi...' : 'Ajouter'}
                    <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4">
              <label className="font-bold flex items-center gap-2 mb-2"><MessageSquare size={16} className="text-slate-400" /> Remarque (optionnel)</label>
              <textarea
                rows="3"
                maxLength={1000}
                value={form.note}
                onChange={(e) => setField('note', e.target.value)}
                className={inputClass}
              />
            </section>

            {/* Honeypot: hidden from people, bots tend to fill it */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={form.website}
              onChange={(e) => setField('website', e.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Envoyer ma demande
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
