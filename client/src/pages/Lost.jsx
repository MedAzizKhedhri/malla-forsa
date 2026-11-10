import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import {
  Plus, Loader2, Trash2, Edit, Check, X, FolderPlus, FolderMinus, ImageOff,
  ImageIcon, Globe, Truck, ArrowRightLeft,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import Lightbox from '../components/Lightbox';
import EmptyState from '../components/EmptyState';

const inputClass = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500';

const CAUSES = [
  { key: 'shein', label: 'Perdu par Shein', hint: 'Perdu en Europe, jamais reçu', icon: Globe },
  { key: 'transporteur', label: 'Perdu par le transporteur', hint: 'Perdu pendant l\'envoi vers nous', icon: Truck },
];

// Photos added before causes existed count as Shein
const causeOf = (item) => item.cause || 'shein';

// Cause picker plus, for the transporteur cause, which transporteur lost it
function CauseFields({ value, onChange, transporteurs }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Cause de la perte *</label>
        <div className="grid grid-cols-2 gap-2">
          {CAUSES.map(c => {
            const Icon = c.icon;
            const active = value.cause === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onChange({ ...value, cause: c.key })}
                className={`text-left rounded-xl border-2 p-3 transition-colors cursor-pointer ${
                  active
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon size={18} className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                <p className="text-sm font-semibold mt-1.5">{c.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.hint}</p>
              </button>
            );
          })}
        </div>
      </div>
      {value.cause === 'transporteur' && (
        <div>
          <label className="block text-sm font-medium mb-1">Transporteur</label>
          <select
            value={value.transporteur}
            onChange={(e) => onChange({ ...value, transporteur: e.target.value })}
            className={`${inputClass} dark:bg-slate-900`}
          >
            <option value="">Non précisé</option>
            {transporteurs.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

export default function Lost() {
  const toast = useAppToast();

  const [items, setItems] = useState([]);
  const [transporteurs, setTransporteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('shein');

  const [selected, setSelected] = useState([]);
  const [addForm, setAddForm] = useState(null); // { cause, transporteur, group, images: [url] }
  const [uploading, setUploading] = useState(false);
  const [causeForm, setCauseForm] = useState(null); // { cause, transporteur }
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
    api.get('/transporteurs').then(res => setTransporteurs(res.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const defaultTransporteur = () => transporteurs.find(t => t.isDefault)?.name || '';
  const groupNamesFor = (cause) => [...new Set(
    items.filter(i => causeOf(i) === cause).map(i => i.group).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  // Named groups first (alphabetical), ungrouped photos last
  const tabItems = items.filter(i => causeOf(i) === tab);
  const groupNames = groupNamesFor(tab);
  const sections = [
    ...groupNames.map(name => ({ name, items: tabItems.filter(i => i.group === name) })),
    { name: '', items: tabItems.filter(i => !i.group) },
  ].filter(s => s.items.length > 0);

  const switchTab = (key) => {
    setTab(key);
    setSelected([]);
  };

  // ── Adding photos ────────────────────────────────────────────
  const openAdd = (group = '') => {
    setAddForm({ cause: tab, transporteur: defaultTransporteur(), group, priceTnd: '', priceEur: '', images: [] });
  };

  const handleUpload = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    const results = await Promise.allSettled(files.map(file => {
      const data = new FormData();
      data.append('image', file);
      return api.post('/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }));
    const urls = results.filter(r => r.status === 'fulfilled').map(r => r.value.data);
    if (urls.length < files.length) toast.error(`${files.length - urls.length} photo(s) n'ont pas pu être téléversées.`);
    setAddForm(prev => prev && { ...prev, images: [...prev.images, ...urls] });
    setUploading(false);
  };

  const removeImage = (url) => {
    setAddForm(prev => ({ ...prev, images: prev.images.filter(u => u !== url) }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/lost', addForm);
      const n = addForm.images.length;
      toast.success(n > 1 ? `${n} photos ajoutées.` : 'Photo ajoutée.');
      switchTab(addForm.cause);
      setAddForm(null);
      fetchItems();
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  // ── Selection actions ────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openCauseChange = () => {
    setCauseForm({
      cause: tab === 'shein' ? 'transporteur' : 'shein',
      transporteur: defaultTransporteur(),
    });
  };

  const handleCauseSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/lost/cause', { ids: selected, ...causeForm });
      toast.success('Cause mise à jour.');
      setSelected([]);
      setCauseForm(null);
      fetchItems();
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
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
        await api.put('/lost/group/rename', { cause: tab, from: groupModal.from, to: groupName });
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
      await api.put('/lost/group/rename', { cause: tab, from: name, to: '' });
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

  const activeCause = CAUSES.find(c => c.key === tab);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lost</h1>
          <p className="text-sm text-slate-500 mt-1">Photos des articles perdus, par cause et par arrivage.</p>
        </div>
        <button
          onClick={() => openAdd()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer shrink-0"
        >
          <Plus size={18} /> Ajouter des photos
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {CAUSES.map(c => {
          const Icon = c.icon;
          const active = tab === c.key;
          const count = items.filter(i => causeOf(i) === c.key).length;
          return (
            <button
              key={c.key}
              onClick={() => switchTab(c.key)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{c.label}</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                {count}
              </span>
            </button>
          );
        })}
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
          <button onClick={openCauseChange} className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800 cursor-pointer">
            <ArrowRightLeft size={15} /> Changer la cause
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
      ) : tabItems.length === 0 ? (
        <EmptyState message={`Aucune photo dans « ${activeCause.label} ».`} icon={ImageOff} />
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
                  <button
                    onClick={() => openAdd(section.name)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer"
                  >
                    <Plus size={14} /> Ajouter
                  </button>
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
                    {((tab === 'transporteur' && item.transporteur) || item.priceTnd != null || item.priceEur != null) && (
                      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 pointer-events-none">
                        {tab === 'transporteur' && item.transporteur && (
                          <span className="max-w-full truncate flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white">
                            <Truck size={10} className="shrink-0" /> {item.transporteur}
                          </span>
                        )}
                        {item.priceTnd != null && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/90 text-white">
                            {item.priceTnd} TND
                          </span>
                        )}
                        {item.priceEur != null && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600/90 text-white">
                            {item.priceEur} €
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {/* Add photos */}
      <Modal open={!!addForm} onClose={() => !uploading && setAddForm(null)} maxWidth="lg">
        <h2 className="text-2xl font-bold mb-6">Ajouter des articles perdus</h2>
        {addForm && (
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <CauseFields
              value={addForm}
              onChange={(v) => setAddForm(v)}
              transporteurs={transporteurs}
            />

            <div>
              <label className="block text-sm font-medium mb-1">Groupe (optionnel)</label>
              <input
                type="text"
                list="lost-add-groups"
                placeholder="ex: Last arrivage"
                value={addForm.group}
                onChange={(e) => setAddForm({ ...addForm, group: e.target.value })}
                className={inputClass}
              />
              <datalist id="lost-add-groups">
                {groupNamesFor(addForm.cause).map(name => <option key={name} value={name} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Prix en dinars (optionnel)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={addForm.priceTnd}
                    onChange={(e) => setAddForm({ ...addForm, priceTnd: e.target.value })}
                    className={`${inputClass} pr-14`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">TND</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix en euros (optionnel)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={addForm.priceEur}
                    onChange={(e) => setAddForm({ ...addForm, priceEur: e.target.value })}
                    className={`${inputClass} pr-10`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">€</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Photos *</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {addForm.images.map(url => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img src={url} alt="Article perdu" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all text-xs text-slate-500 text-center ${uploading ? 'pointer-events-none' : 'cursor-pointer'}`}>
                  {uploading ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <ImageIcon size={18} className="text-slate-400" />}
                  {uploading ? 'Téléversement...' : 'Ajouter'}
                  <input type="file" accept="image/*" multiple onChange={handleUpload} disabled={uploading} className="hidden" />
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setAddForm(null)}
                disabled={uploading}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || uploading || addForm.images.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Change cause of selected photos */}
      <Modal open={!!causeForm} onClose={() => setCauseForm(null)} maxWidth="lg">
        <h2 className="text-xl font-bold mb-5">Changer la cause</h2>
        {causeForm && (
          <form onSubmit={handleCauseSubmit} className="space-y-4">
            <CauseFields value={causeForm} onChange={setCauseForm} transporteurs={transporteurs} />
            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setCauseForm(null)}
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
        )}
      </Modal>

      {/* Group / rename */}
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
