import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import { Plus, Loader2, Trash2, Edit, ImageIcon, X, Tag } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import Lightbox from '../components/Lightbox';

const emptyForm = { screenshot: '', description: '', tags: '' };

export default function WinningProducts() {
  const toast = useAppToast();

  const [items, setItems] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [activeTags, setActiveTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    // Unfiltered fetch once, to build the full tag vocabulary for the filter chips
    api.get('/winning-products').then(res => {
      const tags = new Set();
      res.data.forEach(item => (item.tags || []).forEach(t => tags.add(t)));
      setAllTags([...tags].sort());
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTags]);

  const fetchItems = async () => {
    try {
      const qs = activeTags.length ? `?tags=${activeTags.map(encodeURIComponent).join(',')}` : '';
      const res = await api.get(`/winning-products${qs}`);
      setItems(res.data);
    } catch {
      toast.error('Impossible de charger les produits gagnants.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTagFilter = (tag) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const openCreate = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({ screenshot: item.screenshot, description: item.description, tags: (item.tags || []).join(', ') });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData(emptyForm);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData();
      data.append('image', file);
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, screenshot: res.data }));
    } catch {
      toast.error('Erreur lors du téléversement de l\'image.');
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = () => {
    setFormData(prev => ({ ...prev, screenshot: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        screenshot: formData.screenshot,
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (editingItem) {
        await api.put(`/winning-products/${editingItem._id}`, payload);
        toast.success('Produit mis à jour.');
      } else {
        await api.post('/winning-products', payload);
        toast.success('Produit ajouté au tableau.');
      }
      closeModal();
      fetchItems();
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const item = pendingDelete;
    setPendingDelete(null);
    setDeletingId(item._id);
    try {
      await api.delete(`/winning-products/${item._id}`);
      toast.success('Produit supprimé.');
      fetchItems();
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters = activeTags.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits Gagnants</h1>
          <p className="text-sm text-slate-500 mt-1">Tableau d'inspiration des produits qui cartonnent.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer shrink-0"
        >
          <Plus size={18} /> Ajouter un Produit
        </button>
      </div>

      {allTags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTagFilter(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTags.includes(tag)
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-800 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Tag size={12} /> {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-16 text-center text-slate-500">
          {hasFilters ? 'Aucun produit ne correspond à ces tags.' : 'Aucun produit gagnant enregistré.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden hover:shadow-md transition-all group"
            >
              <div className="relative h-44 bg-slate-100 dark:bg-slate-800">
                <img
                  src={item.screenshot}
                  alt={item.description}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setLightboxSrc(item.screenshot)}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(item)}
                    className="bg-white/90 dark:bg-slate-900/90 text-slate-600 hover:text-indigo-600 p-1.5 rounded-md shadow-sm"
                    title="Modifier"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => setPendingDelete(item)}
                    disabled={deletingId === item._id}
                    className="bg-white/90 dark:bg-slate-900/90 text-slate-600 hover:text-red-500 p-1.5 rounded-md shadow-sm disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deletingId === item._id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.description}</p>
                {item.tags?.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={closeModal} maxWidth="lg">
        <h2 className="text-2xl font-bold mb-6">
          {editingItem ? 'Modifier le Produit' : 'Nouveau Produit Gagnant'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Capture d'écran *</label>
            {formData.screenshot ? (
              <div className="relative h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mb-2">
                <img src={formData.screenshot} alt="Capture" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all text-sm text-slate-500">
                {uploading ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <ImageIcon size={18} className="text-slate-400" />}
                {uploading ? 'Téléversement...' : 'Ajouter une capture'}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (séparés par des virgules)</label>
            <input
              type="text"
              placeholder="ex: gadget, cuisine, tendance"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              disabled={saving || uploading || !formData.screenshot}
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
        title="Supprimer ce produit ?"
        message="Ce produit sera retiré du tableau d'inspiration."
      />

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
