import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import {
  Loader2, Link2, Copy, Trash2, Phone, MessageCircle, ExternalLink, UserPlus, Inbox, ImageIcon, Check,
} from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Lightbox from '../components/Lightbox';
import EmptyState from '../components/EmptyState';

const inputClass = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500';

const STATUSES = [
  { key: 'new', label: 'Nouvelles', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { key: 'contacted', label: 'Contactées', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  { key: 'accepted', label: 'Acceptées', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { key: 'rejected', label: 'Refusées', badge: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
];
const statusOf = (key) => STATUSES.find(s => s.key === key) || STATUSES[0];

const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

const amountToDraft = (n) => (n === null || n === undefined ? '' : String(n));

export default function Demandes() {
  const toast = useAppToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('new');

  const [openId, setOpenId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const fetchRequests = () => api.get('/shein-requests')
    .then(res => setRequests(res.data))
    .catch(() => toast.error('Impossible de charger les demandes.'))
    .finally(() => setLoading(false));

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = Object.fromEntries(STATUSES.map(s => [s.key, requests.filter(r => r.status === s.key).length]));
  const visible = requests.filter(r => r.status === filter);
  const current = requests.find(r => r._id === openId) || null;

  const openRequest = (request) => {
    setOpenId(request._id);
    setDraft({
      status: request.status,
      estimatedAmountEur: amountToDraft(request.estimatedAmountEur),
      estimatedAmountTnd: amountToDraft(request.estimatedAmountTnd),
      adminNote: request.adminNote || '',
      rejectionReason: request.rejectionReason || '',
    });
  };

  const closeRequest = () => {
    setOpenId(null);
    setDraft(null);
  };

  const copyFormLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/demande`);
      toast.success('Lien du formulaire copié.');
    } catch {
      toast.error('Impossible de copier le lien.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/shein-requests/${current._id}`, draft);
      setRequests(prev => prev.map(r => (r._id === res.data._id ? res.data : r)));
      toast.success('Demande mise à jour.');
      closeRequest();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    try {
      // Save the estimate and notes first so they land on the new order
      await api.put(`/shein-requests/${current._id}`, {
        estimatedAmountEur: draft.estimatedAmountEur,
        estimatedAmountTnd: draft.estimatedAmountTnd,
        adminNote: draft.adminNote,
      });
      const res = await api.post(`/shein-requests/${current._id}/convert`);
      setRequests(prev => prev.map(r => (r._id === res.data.request._id ? res.data.request : r)));
      toast.success(
        res.data.existingClient
          ? `Panier ajouté au client existant « ${res.data.clientName} ».`
          : `Client « ${res.data.clientName} » et panier créés.`
      );
      closeRequest();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la conversion.');
    } finally {
      setConverting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const request = pendingDelete;
    setPendingDelete(null);
    try {
      await api.delete(`/shein-requests/${request._id}`);
      setRequests(prev => prev.filter(r => r._id !== request._id));
      toast.success('Demande supprimée.');
      closeRequest();
    } catch {
      toast.error('Erreur lors de la suppression.');
    }
  };

  const whatsappHref = (phone) => `https://wa.me/${String(phone).replace(/\D/g, '')}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Demandes Shein</h1>
          <p className="text-sm text-slate-500 mt-1">Les demandes envoyées par vos clients depuis le formulaire public.</p>
        </div>
        <button
          onClick={copyFormLink}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer shrink-0"
        >
          <Copy size={16} /> Copier le lien du formulaire
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filter === s.key
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-800 dark:text-indigo-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {s.label}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
              {counts[s.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState message={`Aucune demande « ${statusOf(filter).label.toLowerCase()} ».`} icon={Inbox} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map(request => (
            <button
              key={request._id}
              onClick={() => openRequest(request)}
              className="text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all p-3 flex gap-3 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                {request.images[0]
                  ? <img src={request.images[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                  : <Link2 size={22} className="text-slate-300 dark:text-slate-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider text-slate-400">{request.reference}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusOf(request.status).badge}`}>
                    {statusOf(request.status).label.replace(/s$/, '')}
                  </span>
                </div>
                <p className="font-bold truncate mt-0.5">{request.name}</p>
                <p className="text-sm text-slate-500 truncate">{request.phone}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><ImageIcon size={12} /> {request.images.length}</span>
                  <span className="flex items-center gap-1"><Link2 size={12} /> {request.items.filter(i => i.link).length}</span>
                  <span className="ml-auto">{formatDate(request.createdAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!current} onClose={closeRequest} maxWidth="xl">
        {current && draft && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider text-slate-400">{current.reference}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusOf(current.status).badge}`}>
                  {statusOf(current.status).label.replace(/s$/, '')}
                </span>
                <span className="text-xs text-slate-400 ml-auto">{formatDate(current.createdAt)}</span>
              </div>
              <h2 className="text-2xl font-bold mt-1">{current.name}</h2>
              <p className="text-sm text-slate-500">
                {current.phone} · préfère {current.contactPref === 'call' ? 'un appel' : 'WhatsApp'}
              </p>
              <div className="flex gap-2 mt-3">
                <a
                  href={whatsappHref(current.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
                <a
                  href={`tel:${current.phone}`}
                  className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Phone size={15} /> Appeler
                </a>
              </div>
            </div>

            {current.items.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Articles</h3>
                {current.items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm">
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                      >
                        <ExternalLink size={13} className="shrink-0" /> {item.link}
                      </a>
                    )}
                    {item.details && <p className="text-slate-600 dark:text-slate-300 mt-0.5">{item.details}</p>}
                  </div>
                ))}
              </div>
            )}

            {current.images.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Photos</h3>
                <div className="grid grid-cols-4 gap-2">
                  {current.images.map(url => (
                    <img
                      key={url}
                      src={url}
                      alt="Article demandé"
                      loading="lazy"
                      onClick={() => setLightboxSrc(url)}
                      className="aspect-square w-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-slate-200 dark:border-slate-700"
                    />
                  ))}
                </div>
              </div>
            )}

            {current.note && (
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Remarque du client</h3>
                <p className="text-sm whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">{current.note}</p>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Traitement</h3>

              {!current.clientPanier && (
                <div>
                  <label className="block text-sm font-medium mb-1">Statut</label>
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                    className={`${inputClass} dark:bg-slate-900`}
                  >
                    <option value="new">Nouvelle</option>
                    <option value="contacted">Contactée</option>
                    <option value="rejected">Refusée</option>
                  </select>
                </div>
              )}

              {draft.status === 'rejected' && !current.clientPanier && (
                <div>
                  <label className="block text-sm font-medium mb-1">Motif du refus</label>
                  <input
                    type="text"
                    value={draft.rejectionReason}
                    onChange={(e) => setDraft({ ...draft, rejectionReason: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Estimation (TND)</label>
                  <input
                    type="number" min="0" step="0.01" inputMode="decimal"
                    value={draft.estimatedAmountTnd}
                    onChange={(e) => setDraft({ ...draft, estimatedAmountTnd: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estimation (€)</label>
                  <input
                    type="number" min="0" step="0.01" inputMode="decimal"
                    value={draft.estimatedAmountEur}
                    onChange={(e) => setDraft({ ...draft, estimatedAmountEur: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Note privée</label>
                <textarea
                  rows="2"
                  value={draft.adminNote}
                  onChange={(e) => setDraft({ ...draft, adminNote: e.target.value })}
                  className={inputClass}
                />
              </div>

              {current.clientPanier && (
                <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check size={16} /> Convertie en client et panier.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setPendingDelete(current)}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                title="Supprimer la demande"
              >
                <Trash2 size={18} />
              </button>
              <div className="flex gap-2 ml-auto flex-wrap justify-end">
                <button
                  onClick={closeRequest}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || converting}
                  className="px-4 py-2 rounded-lg border border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
                {!current.clientPanier && (
                  <button
                    onClick={handleConvert}
                    disabled={saving || converting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 font-semibold disabled:opacity-70"
                  >
                    {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus size={16} />}
                    Créer client + panier
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer cette demande ?"
        message={pendingDelete ? `La demande ${pendingDelete.reference} de ${pendingDelete.name} sera retirée de la liste.` : ''}
      />

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
