import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import { Mail, Plus, Loader2, Trash2, Pencil, CheckCircle, AlertCircle, Eye, EyeOff, Copy, KeyRound } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Emails() {
  const toast = useAppToast();
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revealedIds, setRevealedIds] = useState(new Set());

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({ email: '', label: '', password: '' });

  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({ account: '', subject: '', snippet: '' });

  const [saving, setSaving] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [deletingLogId, setDeletingLogId] = useState(null);
  const [handlingLogId, setHandlingLogId] = useState(null);
  const [pendingDeleteAccount, setPendingDeleteAccount] = useState(null);
  const [pendingDeleteLog, setPendingDeleteLog] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, logsRes] = await Promise.all([
        api.get('/emails/accounts'),
        api.get('/emails/logs'),
      ]);
      setAccounts(accountsRes.data);
      setLogs(logsRes.data);
    } catch {
      toast.error('Impossible de charger les données email.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm({ email: '', label: '', password: '' });
    setShowAccountModal(true);
  };

  const openEditAccount = (account) => {
    setEditingAccount(account);
    setAccountForm({ email: account.email || '', label: account.label || '', password: account.password || '' });
    setShowAccountModal(true);
  };

  const handleSubmitAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingAccount) {
        await api.put(`/emails/accounts/${editingAccount._id}`, accountForm);
        toast.success('Compte mis à jour.');
      } else {
        await api.post('/emails/accounts', accountForm);
        toast.success('Compte ajouté avec succès.');
      }
      setShowAccountModal(false);
      setEditingAccount(null);
      setAccountForm({ email: '', label: '', password: '' });
      fetchData();
    } catch {
      toast.error(editingAccount ? 'Erreur lors de la mise à jour du compte.' : 'Erreur lors de l\'ajout du compte.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = (account) => {
    setPendingDeleteAccount(account);
  };

  const handleDeleteAccountConfirm = async () => {
    if (!pendingDeleteAccount) return;
    const account = pendingDeleteAccount;
    setDeletingAccountId(account._id);
    setPendingDeleteAccount(null);
    try {
      await api.delete(`/emails/accounts/${account._id}`);
      toast.success(`Compte "${account.label}" supprimé.`);
      setAccounts((prev) => prev.filter((a) => a._id !== account._id));
      setLogs((prev) => prev.filter((l) => l.account?._id !== account._id));
    } catch {
      toast.error('Erreur lors de la suppression du compte.');
    } finally {
      setDeletingAccountId(null);
    }
  };

  const toggleReveal = (id) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyPassword = async (password) => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Mot de passe copié.');
    } catch {
      toast.error('Impossible de copier le mot de passe.');
    }
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/emails/logs', logForm);
      toast.success('Action signalée avec succès.');
      setShowLogModal(false);
      setLogForm({ account: '', subject: '', snippet: '' });
      fetchData();
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const markLogHandled = async (id) => {
    setHandlingLogId(id);
    try {
      await api.put(`/emails/logs/${id}`, { status: 'Handled' });
      setLogs((prev) =>
        prev.map((l) => (l._id === id ? { ...l, status: 'Handled' } : l))
      );
      toast.success('Action marquée comme traitée.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setHandlingLogId(null);
    }
  };

  const handleDeleteLog = (log) => {
    setPendingDeleteLog(log);
  };

  const handleDeleteLogConfirm = async () => {
    if (!pendingDeleteLog) return;
    const log = pendingDeleteLog;
    setDeletingLogId(log._id);
    setPendingDeleteLog(null);
    try {
      await api.delete(`/emails/logs/${log._id}`);
      toast.success('Log supprimé.');
      setLogs((prev) => prev.filter((l) => l._id !== log._id));
    } catch {
      toast.error('Erreur lors de la suppression du log.');
    } finally {
      setDeletingLogId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Comptes Emails & Actions</h1>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Accounts Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Comptes Acheteurs</h2>
              <button
                onClick={openCreateAccount}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Plus size={16} /> Ajouter
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {accounts.map((account) => {
                const revealed = revealedIds.has(account._id);
                return (
                  <div
                    key={account._id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Mail size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{account.label}</div>
                      <div className="text-xs text-slate-500 truncate">{account.email}</div>
                      {account.password && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <KeyRound size={12} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                            {revealed ? account.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => toggleReveal(account._id)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 shrink-0"
                            title={revealed ? 'Cacher' : 'Afficher'}
                          >
                            {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                          <button
                            onClick={() => copyPassword(account.password)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 shrink-0"
                            title="Copier le mot de passe"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button
                        onClick={() => openEditAccount(account)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        title="Modifier ce compte"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account)}
                        disabled={deletingAccountId === account._id}
                        className="text-slate-400 hover:text-red-500 transition-all p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                        title="Supprimer ce compte"
                      >
                        {deletingAccountId === account._id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
              {accounts.length === 0 && (
                <div className="col-span-full text-center p-6 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                  Aucun compte configuré.
                </div>
              )}
            </div>
          </section>

          {/* Logs Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Actions Requises (Emails)</h2>
              <button
                onClick={() => setShowLogModal(true)}
                disabled={accounts.length === 0}
                className="bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Plus size={16} /> Signaler une action
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {logs.length === 0 ? (
                <div className="p-12 text-center text-slate-500">Aucune action requise pour le moment.</div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {logs.map((log) => (
                    <div
                      key={log._id}
                      className={`p-4 flex items-start gap-4 transition-colors group ${
                        log.status === 'Handled'
                          ? 'opacity-60 bg-slate-50 dark:bg-slate-800/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="mt-1">
                        {log.status === 'Handled' ? (
                          <CheckCircle className="text-emerald-500" size={20} />
                        ) : (
                          <AlertCircle className="text-orange-500" size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-bold">{log.subject}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {log.account?.label || 'Compte supprimé'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{log.snippet}</p>
                        <div className="text-xs text-slate-400 mt-2">
                          Signalé le {new Date(log.date).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {log.status !== 'Handled' && (
                          <button
                            onClick={() => markLogHandled(log._id)}
                            disabled={handlingLogId === log._id}
                            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {handlingLogId === log._id && <Loader2 size={12} className="animate-spin" />}
                            Traité
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLog(log)}
                          disabled={deletingLogId === log._id}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                          title="Supprimer ce log"
                        >
                          {deletingLogId === log._id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* CONFIRM DELETE ACCOUNT */}
      <ConfirmDialog
        open={!!pendingDeleteAccount}
        onClose={() => setPendingDeleteAccount(null)}
        onConfirm={handleDeleteAccountConfirm}
        title="Supprimer le compte"
        message={`Supprimer le compte "${pendingDeleteAccount?.label}" et tous ses logs ?`}
        loading={!!deletingAccountId}
      />

      {/* CONFIRM DELETE LOG */}
      <ConfirmDialog
        open={!!pendingDeleteLog}
        onClose={() => setPendingDeleteLog(null)}
        onConfirm={handleDeleteLogConfirm}
        title="Supprimer le log"
        message="Supprimer cette action email ?"
        loading={!!deletingLogId}
      />

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">{editingAccount ? 'Modifier le compte' : 'Ajouter un compte'}</h2>
            <form onSubmit={handleSubmitAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Libellé (ex: Shein FR) *</label>
                <input
                  required
                  type="text"
                  value={accountForm.label}
                  onChange={(e) => setAccountForm({ ...accountForm, label: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  required
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe Shein</label>
                <input
                  type="text"
                  placeholder="Mot de passe du compte"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">Enregistré pour vous éviter de le rechercher à chaque connexion.</p>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => { setShowAccountModal(false); setEditingAccount(null); setAccountForm({ email: '', label: '', password: '' }); }}
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
          </div>
        </div>
      )}

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">Signaler une action (Email)</h2>
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Compte concerné *</label>
                <select
                  required
                  value={logForm.account}
                  onChange={(e) => setLogForm({ ...logForm, account: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled className="dark:bg-slate-800">Sélectionner</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id} className="dark:bg-slate-800">{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sujet / Motif *</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Vérification de paiement Shein"
                  value={logForm.subject}
                  onChange={(e) => setLogForm({ ...logForm, subject: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Détails (Optionnel)</label>
                <textarea
                  value={logForm.snippet}
                  onChange={(e) => setLogForm({ ...logForm, snippet: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => { setShowLogModal(false); setLogForm({ account: '', subject: '', snippet: '' }); }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !logForm.account}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
