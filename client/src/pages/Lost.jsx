import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import { Plus, Loader2, Trash2, Edit, Check, X, FolderPlus, FolderMinus, ImageOff } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import Lightbox from '../components/Lightbox';
import EmptyState from '../components/EmptyState';

const inputClass = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500';

export default function Lost() {
  const toast = useAppToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // Name of the group currently receiving uploads ('' = ungrouped), null when idle
  const [uploadingTo, setUploadingTo] = useState(null);

  const [selected, setSelected] = useState([]);
  const [groupModal, setGroupModal] = useState(null); // { mode: 'assign' | 'rename', from? }
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const fetchItems = () => api.get('/lost')
    .then(res => setItems(res.data))
    .catch(() => toast.error('Impossible de charger les photos.'))
    .finally(() => setLoading(false));

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Named groups first (alphabetical), ungrouped photos last
  const groupNames = [...new Set(items.map(i => i.group).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const sections = [
    ...groupNames.map(name => ({ name, items: items.filter(i => i.group === name) })),
    { name: '', items: items.filter(i => !i.group) },
  ].filter(s => s.items.length > 0);

  const handleUpload = async (e, group) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    setUploadingTo(group);
    try {
      const urls = [];
      for (const file of files) {
        const data = new FormData();
        data.append('image', file);
        const res = await api.post('/upload', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        urls.push(res.data);
      }
      await api.post('/lost', { images: urls, group });
      toast.success(urls.length > 1 ? `${urls.length} photos ajoutées.` : 'Photo ajoutée.');
      fetchItems();
    } catch {
      toast.error('Erreur lors du téléversement des photos.');
    } finally {
      setUploadingTo(null);
    }
  };

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openAssign = () => {
    setGroupName('');
    setGroupModal({ mode: 'assign' });
  };

  const openRename = (name) => {
    setGroupName(name);
    setGroupModal({ mode: 'rename', from: name });
  };

  const closeGroupModal = () => {
    setGroupModal(null);
    setGroupName('');
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (groupModal.mode === 'assign') {
        await api.put('/lost/group', { ids: selected, group: groupName });
        toast.success(`Photos ajoutées au groupe "${groupName.trim()}".`);
        setSelected([]);
      } else {
        await api.put('/lost/group/rename', { from: groupModal.from, to: groupName });
        toast.success('Groupe renommé.');
      }
      closeGroupModal();
      fetchItems();
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const removeFromGroup = async () => {
    try {
      await api.put('/lost/group', { ids: selected, group: '' });
      toast.success('Photos retirées de leur groupe.');
      setSelected([]);
      fetchItems();
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const dissolveGroup = async (name) => {
    try {
      await api.put('/lost/group/rename', { from: name, to: '' });
      toast.success(`Groupe "${name}" dissous.`);
      fetchItems();
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const handleDeleteConfirm = async () => {
    setSaving(true);
    try {
      await api.post('/lost/delete', { ids: selected });
      toast.success('Photos supprimées.');
      setSelected([]);
      fetchItems();
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setSaving(false);
      setPendingDelete(false);
    }
  };

  const uploadButton = (group, label) => (
    <label className={`flex items-center font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
      group === ''
        ? 'gap-2 px-4 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
        : 'gap-1.5 px-2.5 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
    } ${uploadingTo !== null ? 'opacity-60 pointer-events-none' : ''}`}>
      {uploadingTo === group ? <Loader2 size={group === '' ? 18 : 14} className="animate-spin" /> : <Plus size={group === '' ? 18 : 14} />}
      {uploadingTo === group ? 'Téléversement...' : label}
      <input type="file" accept="image/*" multiple onChange={(e) => handleUpload(e, group)} className="hidden" />
    </label>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lost</h1>
          <p className="text-sm text-slate-500 mt-1">Photos des articles perdus, regroupées par arrivage.</p>
        </div>
        {uploadButton('', 'Ajouter des photos')}
      </div>

      {selected.length > 0 && (
        <div className="sticky top-16 md:top-4 z-10 flex items-center gap-2 flex-wrap rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/95 dark:bg-indigo-950/80 backdrop-blur px-4 py-3 shadow-sm">
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mr-auto">
            {selected.length} photo{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''}
          </span>
          <button onClick={openAssign} className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
            <FolderPlus size={15} /> Grouper
          </button>
          <button onClick={removeFromGroup} className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800 cursor-pointer">
            <FolderMinus size={15} /> Retirer du groupe
          </button>
          <button onClick={() => setPendingDelete(true)} className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer">
            <Trash2 size={15} /> Supprimer
          </button>
          <button onClick={() => setSelected([])} className="p-1.5 rounded-lg text-slate-500 hover:bg-white/70 dark:hover:bg-slate-800 cursor-pointer" title="Annuler la sélection">
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState message="Aucune photo d'article perdu." icon={ImageOff} />
      ) : (
        sections.map(section => (
          <section key={section.name || '__ungrouped'} className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold">
                {section.name || 'Sans groupe'}
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                {section.items.length}
              </span>
              {section.name && (
                <div className="flex items-center gap-1 ml-auto">
                  {uploadButton(section.name, 'Ajouter')}
                  <button
                    onClick={() => openRename(section.name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Renommer le groupe"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => dissolveGroup(section.name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Dissoudre le groupe (les photos restent)"
                  >
                    <FolderMinus size={15} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {section.items.map(item => {
                const isSelected = selected.includes(item._id);
                return (
                  <div
                    key={item._id}
                    className={`relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group border-2 transition-colors ${
                      isSelected ? 'border-indigo-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={item.image}
                      alt="Article perdu"
                      loading="lazy"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => selected.length ? toggleSelect(item._id) : setLightboxSrc(item.image)}
                    />
                    <button
                      onClick={() => toggleSelect(item._id)}
                      className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center shadow-sm transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white opacity-100'
                          : 'bg-white/90 dark:bg-slate-900/90 text-transparent hover:text-slate-400 opacity-100 md:opacity-0 md:group-hover:opacity-100'
                      } ${selected.length ? 'md:opacity-100' : ''}`}
                      title="Sélectionner"
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      <Modal open={!!groupModal} onClose={closeGroupModal} maxWidth="sm">
        <h2 className="text-xl font-bold mb-5">
          {groupModal?.mode === 'rename' ? 'Renommer le groupe' : 'Grouper les photos'}
        </h2>
        <form onSubmit={handleGroupSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom du groupe *</label>
            <input
              required
              autoFocus
              type="text"
              list="lost-groups"
              placeholder="ex: Last arrivage"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={inputClass}
            />
            <datalist id="lost-groups">
              {groupNames.map(name => <option key={name} value={name} />)}
            </datalist>
            {groupModal?.mode === 'assign' && groupNames.length > 0 && (
              <p className="text-xs text-slate-500 mt-1.5">Choisissez un groupe existant ou tapez un nouveau nom.</p>
            )}
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={closeGroupModal}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !groupName.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        onConfirm={handleDeleteConfirm}
        loading={saving}
        title={`Supprimer ${selected.length} photo${selected.length > 1 ? 's' : ''} ?`}
        message="Les photos sélectionnées seront retirées de la page Lost."
      />

      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
