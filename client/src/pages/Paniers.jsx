import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import {
  ShoppingCart, Plus, Loader2, Trash2, Pencil, ArrowLeft, ImageIcon, X,
  Package, Users, Wallet, ChevronDown, Calendar, UserPlus, Gift
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Lightbox from '../components/Lightbox';
import CheckboxMultiSelect from '../components/CheckboxMultiSelect';

const emptyForm = {
  name: '', compteAcheteur: '', nombreArticles: '', nombreColis: '', totalPrice: '', devise: 'EUR', arrivage: '', carteCadeauUtilisee: '', screenshots: []
};

const COLIS_STATUSES = ['Pending', 'In Transit', 'Arrived at Carrier', 'Picked Up', 'In Stock'];

export default function Paniers() {
  const toast = useAppToast();
  const [paniers, setPaniers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyerAccounts, setBuyerAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [carteCadeaux, setCarteCadeaux] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingPanier, setEditingPanier] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedPanier, setSelectedPanier] = useState(null);
  const [panierDetails, setPanierDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingColisId, setUpdatingColisId] = useState(null);
  const [trackingDrafts, setTrackingDrafts] = useState({});

  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachClientIds, setAttachClientIds] = useState([]);
  const [attaching, setAttaching] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    fetchPaniers();
    api.get('/emails/accounts').then(res => setBuyerAccounts(res.data)).catch(() => {});
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
    api.get('/carte-cadeaux').then(res => setCarteCadeaux(res.data)).catch(() => {});
  }, []);

  const fetchPaniers = async () => {
    try {
      const res = await api.get('/order-sessions');
      setPaniers(res.data);
    } catch {
      toast.error('Impossible de charger les paniers.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPanierDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/order-sessions/${id}`);
      setPanierDetails(res.data);
      const drafts = {};
      (res.data.colis || []).forEach(c => { drafts[c._id] = c.trackingNumber || ''; });
      setTrackingDrafts(drafts);
    } catch {
      toast.error('Impossible de charger le panier.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectPanier = (panier) => {
    setSelectedPanier(panier);
    fetchPanierDetails(panier._id);
  };

  const openCreate = () => {
    setEditingPanier(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (panier, e) => {
    if (e) e.stopPropagation();
    setEditingPanier(panier);
    setForm({
      name: panier.name || '',
      compteAcheteur: panier.compteAcheteur?._id || panier.compteAcheteur || '',
      nombreArticles: panier.nombreArticles ?? '',
      nombreColis: panier.nombreColis ?? '',
      totalPrice: panier.totalPrice ?? '',
      devise: panier.devise || 'EUR',
      arrivage: panier.arrivage || '',
      carteCadeauUtilisee: panier.carteCadeauUtilisee?._id || panier.carteCadeauUtilisee || '',
      screenshots: panier.screenshots || [],
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const data = new FormData();
        data.append('image', file);
        const res = await api.post('/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push(res.data);
      }
      setForm(prev => ({ ...prev, screenshots: [...prev.screenshots, ...uploaded] }));
    } catch {
      toast.error('Erreur lors du téléversement des images.');
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = (url) => {
    setForm(prev => ({ ...prev, screenshots: prev.screenshots.filter(s => s !== url) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      compteAcheteur: form.compteAcheteur || (editingPanier ? null : undefined),
      nombreArticles: Number(form.nombreArticles) || 0,
      nombreColis: Number(form.nombreColis) || 0,
      totalPrice: Number(form.totalPrice) || 0,
      devise: form.devise,
      arrivage: form.arrivage,
      carteCadeauUtilisee: form.carteCadeauUtilisee || (editingPanier ? null : undefined),
      screenshots: form.screenshots,
    };
    try {
      if (editingPanier) {
        await api.put(`/order-sessions/${editingPanier._id}`, payload);
        toast.success('Panier mis à jour.');
        if (selectedPanier && selectedPanier._id === editingPanier._id) {
          fetchPanierDetails(editingPanier._id);
        }
      } else {
        await api.post('/order-sessions', payload);
        toast.success('Panier créé avec succès.');
      }
      setShowModal(false);
      setEditingPanier(null);
      fetchPaniers();
    } catch {
      toast.error(editingPanier ? 'Erreur lors de la mise à jour du panier.' : 'Erreur lors de la création du panier.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const panier = pendingDelete;
    setPendingDelete(null);
    setDeletingId(panier._id);
    try {
      await api.delete(`/order-sessions/${panier._id}`);
      toast.success('Panier supprimé.');
      if (selectedPanier && selectedPanier._id === panier._id) {
        setSelectedPanier(null);
        setPanierDetails(null);
      }
      fetchPaniers();
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTrackingSave = async (colisId) => {
    setUpdatingColisId(colisId);
    try {
      await api.put(`/colis/${colisId}`, { trackingNumber: trackingDrafts[colisId] || undefined });
      toast.success('Numéro de suivi enregistré.');
      fetchPanierDetails(selectedPanier._id);
    } catch {
      toast.error('Erreur lors de l\'enregistrement du numéro de suivi.');
    } finally {
      setUpdatingColisId(null);
    }
  };

  const handleColisStatusChange = async (colisId, status) => {
    setUpdatingColisId(colisId);
    try {
      await api.put(`/colis/${colisId}`, { status });
      fetchPanierDetails(selectedPanier._id);
    } catch {
      toast.error('Erreur lors de la mise à jour du statut.');
    } finally {
      setUpdatingColisId(null);
    }
  };

  const openAttachModal = () => {
    setAttachClientIds([]);
    setShowAttachModal(true);
  };

  const handleAttachClient = async (e) => {
    e.preventDefault();
    if (attachClientIds.length === 0) return;
    setAttaching(true);
    try {
      const results = await Promise.allSettled(
        attachClientIds.map(clientId => api.post('/client-paniers', {
          client: clientId,
          panier: selectedPanier._id,
        }))
      );
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.length - successCount;
      if (successCount > 0) {
        toast.success(`${successCount} client${successCount !== 1 ? 's' : ''} rattaché${successCount !== 1 ? 's' : ''} au panier.`);
      }
      if (failureCount > 0) {
        toast.error(`Échec du rattachement pour ${failureCount} client${failureCount !== 1 ? 's' : ''}.`);
      }
      setShowAttachModal(false);
      fetchPanierDetails(selectedPanier._id);
      fetchPaniers();
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paniers</h1>
          <p className="text-sm text-slate-500 mt-1">Regroupez les commandes en lots et générez leurs colis automatiquement.</p>
        </div>
        {!selectedPanier && (
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer"
          >
            <Plus size={18} /> Nouveau Panier
          </button>
        )}
      </div>

      {!selectedPanier ? (
        loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : paniers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-16 text-center text-slate-500">
            Aucun panier créé.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paniers.map((panier) => (
              <div
                key={panier._id}
                onClick={() => handleSelectPanier(panier)}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 hover:shadow-md cursor-pointer transition-all relative overflow-hidden group hover:-translate-y-0.5"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingCart size={18} className="text-indigo-500" /> {panier.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEdit(panier, e)}
                      className="text-slate-400 hover:text-indigo-600 transition-all p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      title="Modifier ce panier"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingDelete(panier); }}
                      disabled={deletingId === panier._id}
                      className="text-slate-400 hover:text-red-500 transition-all p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      title="Supprimer ce panier"
                    >
                      {deletingId === panier._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs mb-3">
                  <span className="font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {panier.nombreArticles || 0} article{(panier.nombreArticles || 0) !== 1 ? 's' : ''}
                  </span>
                  <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    {panier.nombreColis || 0} colis
                  </span>
                  <span className="font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {(panier.clients || []).length} client{(panier.clients || []).length !== 1 ? 's' : ''}
                  </span>
                  {panier.arrivage && (
                    <span className="font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      {panier.arrivage}
                    </span>
                  )}
                  {panier.carteCadeauUtilisee && (
                    <span className="font-medium px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 inline-flex items-center gap-1">
                      <Gift size={11} /> {panier.carteCadeauUtilisee.numero}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-2"><Wallet size={14} className="text-slate-400" /> {(panier.totalPrice || 0).toLocaleString()} {panier.devise || 'EUR'}</p>
                  {(panier.clients || []).length > 0 && (
                    <p className="flex items-center gap-2 truncate"><Users size={14} className="text-slate-400 shrink-0" /> {panier.clients.map(c => c.name).join(', ')}</p>
                  )}
                  {panier.compteAcheteur?.label && (
                    <p className="flex items-center gap-2 truncate">
                      <Users size={14} className="text-slate-400 shrink-0" />
                      {panier.compteAcheteur.label}
                      {panier.compteAcheteur.email && (
                        <span className="text-xs text-slate-400">({panier.compteAcheteur.email})</span>
                      )}
                    </p>
                  )}
                  <p className="flex items-center gap-2"><Calendar size={14} className="text-slate-400" /> {new Date(panier.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // PANIER DETAILS VIEW
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <button
                onClick={() => setSelectedPanier(null)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <ShoppingCart className="text-indigo-500" /> {selectedPanier.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Créé le {new Date(selectedPanier.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={(e) => openEdit(panierDetails || selectedPanier, e)}
              className="border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Pencil size={16} /> Modifier
            </button>
          </div>

          {loadingDetails ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : panierDetails && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Summary column */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                  <h3 className="font-bold text-lg mb-2">Résumé</h3>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Articles</span><span className="font-semibold">{panierDetails.nombreArticles || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Colis</span><span className="font-semibold">{panierDetails.nombreColis || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Clients</span><span className="font-semibold">{(panierDetails.clientPaniers || []).length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Prix total</span><span className="font-semibold">{(panierDetails.totalPrice || 0).toLocaleString()} {panierDetails.devise || 'EUR'}</span></div>
                  {panierDetails.arrivage && (
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Arrivage</span><span className="font-semibold">{panierDetails.arrivage}</span></div>
                  )}
                  {panierDetails.compteAcheteur?.label && (
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-slate-500 shrink-0">Compte acheteur</span>
                      <span className="font-semibold text-right">
                        {panierDetails.compteAcheteur.label}
                        {panierDetails.compteAcheteur.email && (
                          <span className="block text-xs font-normal text-slate-400">{panierDetails.compteAcheteur.email}</span>
                        )}
                      </span>
                    </div>
                  )}
                  {panierDetails.carteCadeauUtilisee && (
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-slate-500 shrink-0 flex items-center gap-1"><Gift size={13} /> Carte cadeau</span>
                      <span className="font-semibold text-right">
                        {panierDetails.carteCadeauUtilisee.numero}
                        <span className="block text-xs font-normal text-slate-400">
                          {panierDetails.carteCadeauUtilisee.montant} {panierDetails.carteCadeauUtilisee.devise || 'EUR'}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Users size={18} className="text-indigo-500" /> Clients rattachés</h3>
                    <button
                      onClick={openAttachModal}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer"
                      title="Rattacher un client"
                    >
                      <UserPlus size={18} />
                    </button>
                  </div>
                  {(panierDetails.clientPaniers || []).length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4">Aucun client rattaché à ce panier.</div>
                  ) : (
                    <div className="space-y-2">
                      {panierDetails.clientPaniers.map((cp) => {
                        const paid = (cp.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
                        const total = cp.estimatedAmountTnd + cp.insuranceFee;
                        return (
                          <div key={cp._id} className="flex items-center justify-between text-sm rounded-lg bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
                            <span className="font-semibold">{cp.client?.name}</span>
                            <span className="text-xs text-slate-500">{paid.toLocaleString()} / {total.toLocaleString()} TND</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {panierDetails.screenshots?.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-bold text-lg mb-3">Captures d'écran</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {panierDetails.screenshots.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="Capture"
                          className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setLightboxSrc(url)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Colis column */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Package size={18} className="text-indigo-500" /> Colis générés</h3>
                {(panierDetails.colis || []).length === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-8">Aucun colis généré pour ce panier.</div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {panierDetails.colis.map((c) => (
                      <div key={c._id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 shrink-0">
                            <Package size={18} />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Numéro de suivi..."
                              value={trackingDrafts[c._id] ?? ''}
                              onChange={(e) => setTrackingDrafts(prev => ({ ...prev, [c._id]: e.target.value }))}
                              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTrackingSave(c._id)}
                            disabled={updatingColisId === c._id}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                          >
                            Enregistrer
                          </button>
                          <div className="relative">
                            <select
                              value={c.status}
                              disabled={updatingColisId === c._id}
                              onChange={(e) => handleColisStatusChange(c._id, e.target.value)}
                              className="appearance-none pl-2.5 pr-6 py-1.5 rounded-full text-xs font-bold cursor-pointer border-0 outline-none bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                            >
                              {COLIS_STATUSES.map((s) => (
                                <option key={s} value={s} className="bg-white dark:bg-slate-800">{s}</option>
                              ))}
                            </select>
                            <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW PANIER MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <h2 className="text-2xl font-bold mb-6">{editingPanier ? 'Modifier le Panier' : 'Nouveau Panier'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du panier *</label>
                <input
                  required
                  type="text"
                  placeholder="ex: Panier Juillet #3"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Arrivage (optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: Arrivage 12 Mars"
                  value={form.arrivage}
                  onChange={(e) => setForm({ ...form, arrivage: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Compte acheteur</label>
                <select
                  value={form.compteAcheteur}
                  onChange={(e) => setForm({ ...form, compteAcheteur: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="dark:bg-slate-800">Aucun</option>
                  {buyerAccounts.map(a => (
                    <option key={a._id} value={a._id} className="dark:bg-slate-800">{a.label} — {a.email}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Articles</label>
                  <input
                    type="number"
                    min="0"
                    value={form.nombreArticles}
                    onChange={(e) => setForm({ ...form, nombreArticles: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Colis</label>
                  <input
                    type="number"
                    min="0"
                    value={form.nombreColis}
                    onChange={(e) => setForm({ ...form, nombreColis: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Prix total</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.totalPrice}
                    onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Devise</label>
                  <select
                    value={form.devise}
                    onChange={(e) => setForm({ ...form, devise: e.target.value })}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="EUR" className="dark:bg-slate-800">EUR</option>
                    <option value="USD" className="dark:bg-slate-800">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Carte cadeau utilisée (optionnel)</label>
                <select
                  value={form.carteCadeauUtilisee}
                  onChange={(e) => setForm({ ...form, carteCadeauUtilisee: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="dark:bg-slate-800">Aucune — paiement cash uniquement</option>
                  {carteCadeaux.map(c => (
                    <option key={c._id} value={c._id} className="dark:bg-slate-800">{c.numero} — {c.montant} {c.devise || 'EUR'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Captures d'écran des articles</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {form.screenshots.map((url) => (
                    <div key={url} className="relative h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img
                        src={url}
                        alt="Capture"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setLightboxSrc(url)}
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(url)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center justify-center gap-2 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all text-sm text-slate-500">
                  {uploading ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <ImageIcon size={18} className="text-slate-400" />}
                  {uploading ? 'Téléversement...' : 'Ajouter des captures'}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
                </label>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingPanier(null); }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPanier ? 'Enregistrer' : 'Créer le panier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le panier ?"
        message={pendingDelete ? `"${pendingDelete.name}" et ses colis générés resteront mais seront détachés.` : ''}
      />

      {/* ATTACH CLIENT MODAL */}
      {showAttachModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">Rattacher des Clients</h2>
            <form onSubmit={handleAttachClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Clients *</label>
                <CheckboxMultiSelect
                  options={clients.filter(c => !(panierDetails?.clientPaniers || []).some(cp => cp.client?._id === c._id))}
                  selectedIds={attachClientIds}
                  onChange={setAttachClientIds}
                  getId={c => c._id}
                  getLabel={c => c.name}
                  emptyLabel="Tous les clients sont déjà rattachés à ce panier."
                />
                <p className="text-xs text-slate-500 mt-1.5">Crée une commande vide pour chaque client sélectionné, déjà rattachée à ce panier — les tarifs et paiements se gèrent ensuite depuis la fiche du client.</p>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={attaching || attachClientIds.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {attaching && <Loader2 className="w-4 h-4 animate-spin" />}
                  Rattacher{attachClientIds.length > 0 ? ` (${attachClientIds.length})` : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
