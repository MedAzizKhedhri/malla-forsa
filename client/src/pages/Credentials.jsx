import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import {
  KeyRound, Truck, MapPin, Plus, Loader2, Trash2, Edit, Phone, Route
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyTransporteur = { name: '', phone: '', location: '', route: '' };
const emptyLocation = { name: '', address: '' };

export default function Credentials() {
  const toast = useAppToast();
  const [tab, setTab] = useState('transporteurs');

  const [transporteurs, setTransporteurs] = useState([]);
  const [loadingTransporteurs, setLoadingTransporteurs] = useState(true);
  const [showTransporteurModal, setShowTransporteurModal] = useState(false);
  const [editingTransporteur, setEditingTransporteur] = useState(null);
  const [transporteurForm, setTransporteurForm] = useState(emptyTransporteur);
  const [savingTransporteur, setSavingTransporteur] = useState(false);
  const [pendingDeleteTransporteur, setPendingDeleteTransporteur] = useState(null);
  const [deletingTransporteurId, setDeletingTransporteurId] = useState(null);

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationForm, setLocationForm] = useState(emptyLocation);
  const [savingLocation, setSavingLocation] = useState(false);
  const [pendingDeleteLocation, setPendingDeleteLocation] = useState(null);
  const [deletingLocationId, setDeletingLocationId] = useState(null);

  useEffect(() => {
    fetchTransporteurs();
    fetchLocations();
  }, []);

  const fetchTransporteurs = async () => {
    try {
      const res = await api.get('/transporteurs');
      setTransporteurs(res.data);
    } catch {
      toast.error('Impossible de charger les transporteurs.');
    } finally {
      setLoadingTransporteurs(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data);
    } catch {
      toast.error('Impossible de charger les emplacements.');
    } finally {
      setLoadingLocations(false);
    }
  };

  // Transporteur CRUD
  const openCreateTransporteur = () => {
    setEditingTransporteur(null);
    setTransporteurForm(emptyTransporteur);
    setShowTransporteurModal(true);
  };

  const openEditTransporteur = (t) => {
    setEditingTransporteur(t);
    setTransporteurForm({ name: t.name, phone: t.phone || '', location: t.location || '', route: t.route || '' });
    setShowTransporteurModal(true);
  };

  const handleSubmitTransporteur = async (e) => {
    e.preventDefault();
    setSavingTransporteur(true);
    try {
      if (editingTransporteur) {
        await api.put(`/transporteurs/${editingTransporteur._id}`, transporteurForm);
        toast.success('Transporteur mis à jour.');
      } else {
        await api.post('/transporteurs', transporteurForm);
        toast.success('Transporteur créé.');
      }
      setShowTransporteurModal(false);
      fetchTransporteurs();
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSavingTransporteur(false);
    }
  };

  const handleDeleteTransporteurConfirm = async () => {
    const t = pendingDeleteTransporteur;
    setPendingDeleteTransporteur(null);
    setDeletingTransporteurId(t._id);
    try {
      await api.delete(`/transporteurs/${t._id}`);
      toast.success(`Transporteur "${t.name}" supprimé.`);
      fetchTransporteurs();
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeletingTransporteurId(null);
    }
  };

  // Location CRUD
  const openCreateLocation = () => {
    setEditingLocation(null);
    setLocationForm(emptyLocation);
    setShowLocationModal(true);
  };

  const openEditLocation = (l) => {
    setEditingLocation(l);
    setLocationForm({ name: l.name, address: l.address || '' });
    setShowLocationModal(true);
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    try {
      if (editingLocation) {
        await api.put(`/locations/${editingLocation._id}`, locationForm);
        toast.success('Emplacement mis à jour.');
      } else {
        await api.post('/locations', locationForm);
        toast.success('Emplacement créé.');
      }
      setShowLocationModal(false);
      fetchLocations();
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleDeleteLocationConfirm = async () => {
    const l = pendingDeleteLocation;
    setPendingDeleteLocation(null);
    setDeletingLocationId(l._id);
    try {
      await api.delete(`/locations/${l._id}`);
      toast.success(`Emplacement "${l.name}" supprimé.`);
      fetchLocations();
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeletingLocationId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <KeyRound className="text-indigo-500" /> Identifiants
        </h1>
        <p className="text-sm text-slate-500 mt-1">Transporteurs et emplacements réutilisés dans les formulaires de colis.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab('transporteurs')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 cursor-pointer ${
            tab === 'transporteurs'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Truck size={16} /> Transporteurs
        </button>
        <button
          onClick={() => setTab('locations')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 cursor-pointer ${
            tab === 'locations'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <MapPin size={16} /> Emplacements
        </button>
      </div>

      {tab === 'transporteurs' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openCreateTransporteur}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer"
            >
              <Plus size={18} /> Nouveau Transporteur
            </button>
          </div>
          {loadingTransporteurs ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : transporteurs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-16 text-center text-slate-500">
              Aucun transporteur enregistré.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {transporteurs.map((t) => (
                <div
                  key={t._id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 relative group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Truck size={18} className="text-indigo-500" /> {t.name}
                    </h3>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditTransporteur(t)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setPendingDeleteTransporteur(t)}
                        disabled={deletingTransporteurId === t._id}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        {deletingTransporteurId === t._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {t.phone || 'Non renseigné'}</p>
                    <p className="flex items-center gap-2"><MapPin size={14} className="text-slate-400" /> {t.location || 'Non renseigné'}</p>
                    <p className="flex items-center gap-2"><Route size={14} className="text-slate-400" /> {t.route || 'Non renseignée'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openCreateLocation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer"
            >
              <Plus size={18} /> Nouvel Emplacement
            </button>
          </div>
          {loadingLocations ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : locations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-16 text-center text-slate-500">
              Aucun emplacement enregistré.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((l) => (
                <div
                  key={l._id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 relative group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <MapPin size={18} className="text-indigo-500" /> {l.name}
                    </h3>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditLocation(l)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setPendingDeleteLocation(l)}
                        disabled={deletingLocationId === l._id}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        {deletingLocationId === l._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{l.address || 'Aucune adresse renseignée'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRANSPORTEUR MODAL */}
      {showTransporteurModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">
              {editingTransporteur ? 'Modifier le Transporteur' : 'Nouveau Transporteur'}
            </h2>
            <form onSubmit={handleSubmitTransporteur} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  required
                  type="text"
                  value={transporteurForm.name}
                  onChange={(e) => setTransporteurForm({ ...transporteurForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Numéro de téléphone</label>
                <input
                  type="text"
                  value={transporteurForm.phone}
                  onChange={(e) => setTransporteurForm({ ...transporteurForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Emplacement</label>
                <input
                  type="text"
                  value={transporteurForm.location}
                  onChange={(e) => setTransporteurForm({ ...transporteurForm, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Route</label>
                <input
                  type="text"
                  placeholder="ex: France - Tunisie"
                  value={transporteurForm.route}
                  onChange={(e) => setTransporteurForm({ ...transporteurForm, route: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransporteurModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingTransporteur}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {savingTransporteur && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOCATION MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">
              {editingLocation ? 'Modifier l\'Emplacement' : 'Nouvel Emplacement'}
            </h2>
            <form onSubmit={handleSubmitLocation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom *</label>
                <input
                  required
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <textarea
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {savingLocation && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteTransporteur}
        onClose={() => setPendingDeleteTransporteur(null)}
        onConfirm={handleDeleteTransporteurConfirm}
        title="Supprimer le transporteur ?"
        message={pendingDeleteTransporteur ? `"${pendingDeleteTransporteur.name}" sera définitivement supprimé.` : ''}
      />

      <ConfirmDialog
        open={!!pendingDeleteLocation}
        onClose={() => setPendingDeleteLocation(null)}
        onConfirm={handleDeleteLocationConfirm}
        title="Supprimer l'emplacement ?"
        message={pendingDeleteLocation ? `"${pendingDeleteLocation.name}" sera définitivement supprimé.` : ''}
      />
    </div>
  );
}
