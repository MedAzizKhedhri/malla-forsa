import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import {
  Package, Plus, Loader2, Truck, Calendar, Trash2, ChevronDown,
  ArrowLeft, MapPin, ShoppingCart, ShoppingBag, ImageIcon, X, User
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Lightbox from '../components/Lightbox';
import CheckboxMultiSelect from '../components/CheckboxMultiSelect';

const COLIS_STATUSES = ['Pending', 'In Transit', 'Arrived at Carrier', 'Picked Up', 'In Stock'];

const emptyForm = { name: '', trackingNumber: '', carrier: '', location: '', clients: [], panier: '', nombreArticles: '', status: 'Pending', notes: '', arrivalDate: '' };

const statusColor = (status) => {
  const colors = {
    Pending: 'bg-slate-105 text-slate-800 dark:bg-slate-800 dark:text-slate-400',
    'In Transit': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Arrived at Carrier': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Picked Up': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'In Stock': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default function Colis() {
  const toast = useAppToast();
  const [colisList, setColisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transporteurs, setTransporteurs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [clients, setClients] = useState([]);
  const [paniers, setPaniers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Detail panel states
  const [selectedColis, setSelectedColis] = useState(null);
  const [colisDetails, setColisDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [pendingDeleteColis, setPendingDeleteColis] = useState(null);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [editClientIds, setEditClientIds] = useState([]);

  useEffect(() => {
    fetchColis();
    api.get('/transporteurs').then(res => setTransporteurs(res.data)).catch(() => {});
    api.get('/locations').then(res => setLocations(res.data)).catch(() => {});
    api.get('/clients').then(res => setClients(res.data)).catch(() => {});
    api.get('/order-sessions').then(res => setPaniers(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setEditClientIds((colisDetails?.clients || []).map(c => c._id || c));
  }, [colisDetails?._id]);

  const fetchColis = async () => {
    try {
      const res = await api.get('/colis');
      setColisList(res.data);
    } catch {
      toast.error('Impossible de charger les colis.');
    } finally {
      setLoading(false);
    }
  };

  const fetchColisDetails = async (colisId) => {
    setLoadingDetails(true);
    try {
      const res = await api.get(`/colis/${colisId}`);
      setColisDetails(res.data);
    } catch {
      toast.error('Impossible de charger les détails du colis.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectColis = (colis) => {
    setSelectedColis(colis);
    fetchColisDetails(colis._id);
  };

  const openCreateModal = () => {
    const defaultTransporteur = transporteurs.find(t => t.isDefault);
    const defaultLocation = locations.find(l => l.isDefault);
    setFormData({
      ...emptyForm,
      carrier: defaultTransporteur?.name || '',
      location: defaultLocation?.name || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...formData,
        name: formData.name || undefined,
        trackingNumber: formData.trackingNumber || undefined,
        clients: formData.clients,
        panier: formData.panier || undefined,
        nombreArticles: Number(formData.nombreArticles) || 0,
        arrivalDate: formData.arrivalDate ? new Date(formData.arrivalDate) : undefined
      };
      await api.post('/colis', data);
      toast.success('Colis créé avec succès.');
      setShowModal(false);
      setFormData(emptyForm);
      fetchColis();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la création du colis.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (colisId, newStatus) => {
    setUpdatingStatus(colisId);
    try {
      await api.put(`/colis/${colisId}`, { status: newStatus });
      setColisList((prev) =>
        prev.map((c) => (c._id === colisId ? { ...c, status: newStatus } : c))
      );
      if (colisDetails && colisDetails._id === colisId) {
        setColisDetails(prev => ({ ...prev, status: newStatus }));
      }
      toast.success('Statut du colis mis à jour.');
    } catch {
      toast.error('Erreur lors de la mise à jour du statut.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleUpdateColis = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/colis/${colisDetails._id}`, {
        name: colisDetails.name,
        trackingNumber: colisDetails.trackingNumber || undefined,
        carrier: colisDetails.carrier,
        location: colisDetails.location,
        clients: editClientIds,
        nombreArticles: Number(colisDetails.nombreArticles) || 0,
        arrivalDate: colisDetails.arrivalDate ? new Date(colisDetails.arrivalDate) : null,
        notes: colisDetails.notes
      });
      setColisDetails(res.data);
      fetchColis();
      toast.success('Colis mis à jour.');
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
    }
  };

  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !colisDetails) return;
    setUploadingScreenshots(true);
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
      const screenshots = [...(colisDetails.screenshots || []), ...uploaded];
      const res = await api.put(`/colis/${colisDetails._id}`, { screenshots });
      setColisDetails(res.data);
      fetchColis();
      toast.success('Capture(s) ajoutée(s).');
    } catch {
      toast.error('Erreur lors du téléversement des images.');
    } finally {
      setUploadingScreenshots(false);
    }
  };

  const handleRemoveScreenshot = async (url) => {
    if (!colisDetails) return;
    try {
      const screenshots = (colisDetails.screenshots || []).filter(s => s !== url);
      const res = await api.put(`/colis/${colisDetails._id}`, { screenshots });
      setColisDetails(res.data);
      fetchColis();
    } catch {
      toast.error('Erreur lors de la suppression de la capture.');
    }
  };

  const handleDelete = (colis, e) => {
    if (e) e.stopPropagation();
    setPendingDeleteColis(colis);
  };

  const handleDeleteColisConfirm = async () => {
    if (!pendingDeleteColis) return;
    const colis = pendingDeleteColis;
    setDeletingId(colis._id);
    setPendingDeleteColis(null);
    try {
      await api.delete(`/colis/${colis._id}`);
      toast.success(`Colis "${colis.trackingNumber}" supprimé.`);
      if (selectedColis && selectedColis._id === colis._id) {
        setSelectedColis(null);
        setColisDetails(null);
      }
      fetchColis();
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Colis</h1>
          <p className="text-sm text-slate-500 mt-1">Suivez vos colis d'expédition et leur contenu.</p>
        </div>
        {!selectedColis && (
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer"
          >
            <Plus size={18} /> Nouveau Colis
          </button>
        )}
      </div>

      {/* Main layout */}
      {!selectedColis ? (
        // COLIS GRID LIST
        loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : colisList.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm py-16 text-center text-slate-505">
            Aucun colis enregistré.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {colisList.map((colis) => (
              <div
                key={colis._id}
                onClick={() => handleSelectColis(colis)}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group hover:-translate-y-0.5"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Package size={20} />
                  </div>
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    {/* Status dropdown */}
                    {updatingStatus === colis._id ? (
                      <Loader2 size={16} className="animate-spin text-indigo-500" />
                    ) : (
                      <div className="relative">
                        <select
                          value={colis.status}
                          onChange={(e) => handleStatusChange(colis._id, e.target.value)}
                          className={`appearance-none pl-2.5 pr-7 py-1 rounded-full text-xs font-bold cursor-pointer border-0 outline-none focus:ring-2 focus:ring-indigo-500 ${statusColor(colis.status)}`}
                        >
                          {COLIS_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{s}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                      </div>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(colis)}
                      disabled={deletingId === colis._id}
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deletingId === colis._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>

                {colis.clients?.length > 0 && (
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-0.5 flex items-center gap-1.5">
                    <User size={13} className="text-slate-400 shrink-0" /> {colis.clients.map(c => c.name).join(', ')}
                  </p>
                )}
                <h3 className="text-lg font-bold tracking-tight mb-0.5 text-slate-800 dark:text-slate-200">
                  {colis.name}
                </h3>
                <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mb-2">
                  {colis.trackingNumber || <span className="italic">Sans numéro de suivi</span>}
                </p>

                {colis.panier?.name && (
                  <div className="mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 inline-flex items-center gap-1">
                      <ShoppingCart size={11} /> {colis.panier.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${colis.nombreArticles > 0 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                    <ShoppingBag size={11} /> {colis.nombreArticles ?? 0} article{(colis.nombreArticles ?? 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mt-2">
                  <p className="flex items-center gap-2">
                    <Truck size={16} className="text-slate-400" /> <span className="font-semibold">{colis.carrier || 'Non assigné'}</span>
                  </p>
                  {colis.location && (
                    <p className="flex items-center gap-2">
                      <MapPin size={16} className="text-slate-400" /> <span>{colis.location}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span>Créé le {new Date(colis.createdAt).toLocaleDateString()}</span>
                  </p>
                  {colis.arrivalDate && (
                    <p className="text-xs font-semibold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/25 px-2 py-0.5 rounded-md w-fit">
                      Arrivée : {new Date(colis.arrivalDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // COLIS DETAILS VIEW
        <div className="space-y-6">
          {/* Colis Banner header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <button
                onClick={() => setSelectedColis(null)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                  Détails de l'Expédition
                  {colisDetails?.clients?.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 inline-flex items-center gap-1">
                      <User size={11} /> {colisDetails.clients.map(c => c.name).join(', ')}
                    </span>
                  )}
                  {colisDetails?.panier?.name && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 inline-flex items-center gap-1">
                      <ShoppingCart size={11} /> {colisDetails.panier.name}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 mt-0.5">
                  {(colisDetails ? colisDetails.name : selectedColis.name)}
                </h2>
                <p className="text-sm font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {(colisDetails ? colisDetails.trackingNumber : selectedColis.trackingNumber) || (
                    <span className="italic">Sans numéro de suivi</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              {colisDetails && (
                <div className="relative">
                  <select
                    value={colisDetails.status}
                    onChange={(e) => handleStatusChange(colisDetails._id, e.target.value)}
                    className={`appearance-none pl-3.5 pr-8 py-2 rounded-lg text-sm font-bold cursor-pointer border outline-none border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 ${statusColor(colisDetails.status)}`}
                  >
                    {COLIS_STATUSES.map((s) => (
                      <option key={s} value={s} className="bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100">{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70" />
                </div>
              )}
              <button
                onClick={() => handleDelete(colisDetails || selectedColis)}
                className="border border-red-200 hover:border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} /> Supprimer le Colis
              </button>
            </div>
          </div>

          {/* Editable parameters */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <h3 className="font-bold text-lg">Paramètres & Notes</h3>
            {loadingDetails ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-indigo-500" />
              </div>
            ) : colisDetails ? (
              <form onSubmit={handleUpdateColis} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nom</label>
                    <input
                      type="text"
                      placeholder="Non renseigné"
                      value={colisDetails.name || ''}
                      onChange={(e) => setColisDetails({ ...colisDetails, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Numéro de suivi</label>
                    <input
                      type="text"
                      placeholder="Non renseigné"
                      value={colisDetails.trackingNumber || ''}
                      onChange={(e) => setColisDetails({ ...colisDetails, trackingNumber: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre d'articles</label>
                    <input
                      type="number"
                      min="0"
                      value={colisDetails.nombreArticles ?? 0}
                      onChange={(e) => setColisDetails({ ...colisDetails, nombreArticles: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Transporteur</label>
                    <select
                      value={colisDetails.carrier || ''}
                      onChange={(e) => setColisDetails({ ...colisDetails, carrier: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="" className="dark:bg-slate-800">Aucun</option>
                      {transporteurs.map(t => (
                        <option key={t._id} value={t.name} className="dark:bg-slate-800">{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Emplacement</label>
                    <select
                      value={colisDetails.location || ''}
                      onChange={(e) => setColisDetails({ ...colisDetails, location: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="" className="dark:bg-slate-800">Aucun</option>
                      {locations.map(l => (
                        <option key={l._id} value={l.name} className="dark:bg-slate-800">{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Clients</label>
                    <CheckboxMultiSelect
                      options={clients}
                      selectedIds={editClientIds}
                      onChange={setEditClientIds}
                      getId={c => c._id}
                      getLabel={c => c.name}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date d'arrivée estimée/réelle</label>
                    <input
                      type="date"
                      value={colisDetails.arrivalDate ? new Date(colisDetails.arrivalDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setColisDetails({ ...colisDetails, arrivalDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Notes et informations douanes</label>
                  <textarea
                    value={colisDetails.notes || ''}
                    onChange={(e) => setColisDetails({ ...colisDetails, notes: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="4"
                    placeholder="Indiquez les détails douaniers ou commentaires..."
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400 px-5 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Enregistrer
                </button>
              </form>
            ) : null}
          </div>

          {/* Screenshots */}
          {colisDetails && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-lg">Captures d'écran</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {(colisDetails.screenshots || []).map((url) => (
                  <div key={url} className="relative h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group/shot">
                    <img
                      src={url}
                      alt="Capture"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setLightboxSrc(url)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(url)}
                      className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover/shot:opacity-100 transition-opacity"
                      title="Supprimer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                <label className="flex items-center justify-center gap-1 h-24 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all text-xs text-slate-500 text-center px-2">
                  {uploadingScreenshots ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <ImageIcon size={16} className="text-slate-400" />}
                  {uploadingScreenshots ? 'Envoi...' : 'Ajouter'}
                  <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} disabled={uploadingScreenshots} className="hidden" />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW COLIS MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">Nouveau Colis</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  placeholder="ex: Colis Ahmed - lot 3 (généré automatiquement si vide)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Numéro de Suivi (Tracking)</label>
                <input
                  type="text"
                  placeholder="ex: CH8849202TN (peut être ajouté plus tard)"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre d'articles</label>
                <input
                  type="number"
                  min="0"
                  value={formData.nombreArticles}
                  onChange={(e) => setFormData({ ...formData, nombreArticles: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Transporteur</label>
                <select
                  value={formData.carrier}
                  onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="dark:bg-slate-800">Aucun</option>
                  {transporteurs.map(t => (
                    <option key={t._id} value={t.name} className="dark:bg-slate-800">{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Emplacement</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="dark:bg-slate-800">Aucun</option>
                  {locations.map(l => (
                    <option key={l._id} value={l.name} className="dark:bg-slate-800">{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Clients</label>
                <CheckboxMultiSelect
                  options={clients}
                  selectedIds={formData.clients}
                  onChange={(ids) => setFormData({ ...formData, clients: ids })}
                  getId={c => c._id}
                  getLabel={c => c.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Panier (optionnel — pour rattacher ce colis à un lot existant)</label>
                <select
                  value={formData.panier}
                  onChange={(e) => setFormData({ ...formData, panier: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="dark:bg-slate-800">Aucun</option>
                  {paniers.map(p => (
                    <option key={p._id} value={p._id} className="dark:bg-slate-800">{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date d'arrivée estimée</label>
                <input
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes / Informations Douanes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormData(emptyForm); }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE COLIS */}
      <ConfirmDialog
        open={!!pendingDeleteColis}
        onClose={() => setPendingDeleteColis(null)}
        onConfirm={handleDeleteColisConfirm}
        title="Supprimer le colis"
        message={`Supprimer le colis "${pendingDeleteColis?.trackingNumber || ''}" ?`}
        loading={!!deletingId}
      />

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
