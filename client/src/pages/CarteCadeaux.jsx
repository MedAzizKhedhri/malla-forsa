import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import { Gift, KeyRound, Coins, Plus, Loader2, Trash2, Edit, Search, ShoppingCart } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';

const emptyForm = { numero: '', code: '', montant: '', devise: 'EUR' };

export default function CarteCadeaux() {
  const toast = useAppToast();

  const [cartes, setCartes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paniersByCarte, setPaniersByCarte] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [editingCarte, setEditingCarte] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    fetchCartes();
    api.get('/order-sessions').then(res => {
      const byCarte = {};
      res.data.forEach((p) => {
        const carteId = p.carteCadeauUtilisee?._id || p.carteCadeauUtilisee;
        if (!carteId) return;
        if (!byCarte[carteId]) byCarte[carteId] = [];
        byCarte[carteId].push(p.name);
      });
      setPaniersByCarte(byCarte);
    }).catch(() => {});
  }, []);

  const fetchCartes = async () => {
    try {
      const res = await api.get('/carte-cadeaux');
      setCartes(res.data);
    } catch {
      toast.error('Impossible de charger les cartes cadeaux.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCartes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cartes;
    return cartes.filter(c =>
      c.numero.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [cartes, search]);

  const openCreate = () => {
    setEditingCarte(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (carte) => {
    setEditingCarte(carte);
    setFormData({ numero: carte.numero, code: carte.code, montant: carte.montant, devise: carte.devise || 'EUR' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCarte(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        numero: formData.numero,
        code: formData.code,
        montant: Number(formData.montant) || 0,
        devise: formData.devise,
      };
      if (editingCarte) {
        await api.put(`/carte-cadeaux/${editingCarte._id}`, payload);
        toast.success('Carte cadeau mise à jour.');
      } else {
        await api.post('/carte-cadeaux', payload);
        toast.success('Carte cadeau créée.');
      }
      closeModal();
      fetchCartes();
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const carte = pendingDelete;
    setPendingDelete(null);
    setDeletingId(carte._id);
    try {
      await api.delete(`/carte-cadeaux/${carte._id}`);
      toast.success('Carte cadeau supprimée.');
      fetchCartes();
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cartes Cadeaux</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez le stock de cartes cadeaux et leur montant.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-56"
            />
          </div>
          <button
            onClick={openCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer shrink-0"
          >
            <Plus size={18} /> Nouvelle Carte
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : cartes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-16 text-center text-slate-500">
          Aucune carte cadeau enregistrée.
        </div>
      ) : filteredCartes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-16 text-center text-slate-500">
          Aucune carte ne correspond à "{search}".
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCartes.map((carte) => (
            <div
              key={carte._id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Gift size={18} className="text-indigo-500" /> {carte.numero}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(carte)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    title="Modifier"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setPendingDelete(carte)}
                    disabled={deletingId === carte._id}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deletingId === carte._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                <p className="flex items-center gap-2">
                  <KeyRound size={16} className="text-slate-400" /> {carte.code}
                </p>
                <p className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 text-base pt-1">
                  <Coins size={16} className="text-emerald-500" /> {carte.montant.toLocaleString()} {carte.devise || 'EUR'}
                </p>
                {paniersByCarte[carte._id]?.length > 0 ? (
                  <p className="flex items-start gap-2 text-xs pt-1">
                    <ShoppingCart size={14} className="text-purple-400 shrink-0 mt-0.5" />
                    <span className="text-purple-700 dark:text-purple-400 font-medium">
                      Utilisée dans : {paniersByCarte[carte._id].join(', ')}
                    </span>
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                    <ShoppingCart size={14} className="text-slate-300 dark:text-slate-600" /> Non utilisée
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={closeModal}>
        <h2 className="text-2xl font-bold mb-6">
          {editingCarte ? 'Modifier la Carte Cadeau' : 'Nouvelle Carte Cadeau'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Numéro *</label>
            <input
              required
              type="text"
              value={formData.numero}
              onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code *</label>
            <input
              required
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Montant *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Devise</label>
              <select
                value={formData.devise}
                onChange={(e) => setFormData({ ...formData, devise: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EUR" className="dark:bg-slate-800">EUR</option>
                <option value="USD" className="dark:bg-slate-800">USD</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la carte cadeau ?"
        message={pendingDelete ? `La carte "${pendingDelete.numero}" sera supprimée.` : ''}
      />
    </div>
  );
}
