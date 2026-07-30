import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { useAppToast } from '../components/ToastProvider';
import {
  User, Phone, MapPin, Plus, Loader2, Trash2, Edit, X, Search,
  Calendar, Euro, Coins, FileText, Share2, ArrowLeft, ShoppingCart,
  CreditCard, AlertTriangle, CheckCircle2, Link2, Unlink, ImageIcon, Star
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm = { name: '', phone: '', contactInfo: '', nombreArticles: '', compteAcheteur: '' };
const emptyOrderForm = { name: '', panier: '', nombreArticles: '', estimatedAmountEur: '', estimatedAmountTnd: '', insuranceFee: '', screenshots: [] };

export default function Clients() {
  const toast = useAppToast();

  // Clients list states
  const [clients, setClients] = useState([]);
  const [buyerAccounts, setBuyerAccounts] = useState([]);
  const [paniers, setPaniers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ isPriority: false, dette: false, closed: false });
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteClient, setPendingDeleteClient] = useState(null);
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState(null);

  // Client Details & Orders (ClientPanier) states
  const [selectedClient, setSelectedClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  // New/edit order (ClientPanier) modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [savingOrder, setSavingOrder] = useState(false);
  const [uploadingOrderScreenshots, setUploadingOrderScreenshots] = useState(false);
  const [uploadingDetailScreenshots, setUploadingDetailScreenshots] = useState(false);

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Espèces' });
  const [savingPayment, setSavingPayment] = useState(false);

  // Share agreement view state
  const [showAgreement, setShowAgreement] = useState(false);

  useEffect(() => {
    api.get('/emails/accounts').then(res => setBuyerAccounts(res.data)).catch(() => {});
    api.get('/order-sessions').then(res => setPaniers(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.isPriority) params.set('isPriority', 'true');
      if (filters.dette) params.set('dette', 'true');
      if (filters.closed) params.set('closed', 'true');
      const qs = params.toString();
      const res = await api.get(`/clients${qs ? `?${qs}` : ''}`);
      setClients(res.data);
    } catch {
      toast.error('Impossible de charger les clients.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTogglePriority = async (client, e) => {
    e.stopPropagation();
    try {
      await api.put(`/clients/${client._id}`, { isPriority: !client.isPriority });
      toast.success(!client.isPriority ? 'Client marqué prioritaire.' : 'Priorité retirée.');
      fetchClients();
    } catch {
      toast.error('Erreur lors de la mise à jour de la priorité.');
    }
  };

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q)
    );
  }, [clients, search]);

  const fetchOrders = async (clientId) => {
    setLoadingOrders(true);
    try {
      const res = await api.get(`/client-paniers?client=${clientId}`);
      setOrders(res.data);
    } catch {
      toast.error('Impossible de charger les commandes.');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Client CRUD
  const openCreate = () => {
    setEditingClient(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (client, e) => {
    e.stopPropagation();
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      contactInfo: client.contactInfo || '',
      nombreArticles: client.nombreArticles ?? '',
      compteAcheteur: client.compteAcheteur?._id || client.compteAcheteur || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, nombreArticles: Number(formData.nombreArticles) || 0 };
      if (editingClient) {
        const res = await api.put(`/clients/${editingClient._id}`, payload);
        toast.success('Client mis à jour avec succès.');
        if (selectedClient && selectedClient._id === editingClient._id) {
          setSelectedClient(res.data);
        }
      } else {
        await api.post('/clients', payload);
        toast.success('Client créé avec succès.');
      }
      closeModal();
      fetchClients();
    } catch {
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (client, e) => {
    e.stopPropagation();
    setPendingDeleteClient(client);
  };

  const handleDeleteConfirm = async () => {
    const client = pendingDeleteClient;
    setPendingDeleteClient(null);
    setDeletingId(client._id);
    try {
      await api.delete(`/clients/${client._id}`);
      toast.success(`Client "${client.name}" supprimé.`);
      if (selectedClient && selectedClient._id === client._id) {
        setSelectedClient(null);
        setSelectedOrder(null);
      }
      fetchClients();
    } catch {
      toast.error('Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSelectedOrder(null);
    fetchOrders(client._id);
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
  };

  // Order (ClientPanier) CRUD
  const openCreateOrder = () => {
    setOrderForm(emptyOrderForm);
    setShowOrderModal(true);
  };

  const uploadImages = async (files) => {
    const uploaded = [];
    for (const file of files) {
      const data = new FormData();
      data.append('image', file);
      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      uploaded.push(res.data);
    }
    return uploaded;
  };

  const handleOrderScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingOrderScreenshots(true);
    try {
      const uploaded = await uploadImages(files);
      setOrderForm(prev => ({ ...prev, screenshots: [...prev.screenshots, ...uploaded] }));
    } catch {
      toast.error('Erreur lors du téléversement des images.');
    } finally {
      setUploadingOrderScreenshots(false);
    }
  };

  const removeOrderFormScreenshot = (url) => {
    setOrderForm(prev => ({ ...prev, screenshots: prev.screenshots.filter(s => s !== url) }));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setSavingOrder(true);
    try {
      const res = await api.post('/client-paniers', {
        client: selectedClient._id,
        panier: orderForm.panier || undefined,
        name: orderForm.name || undefined,
        nombreArticles: Number(orderForm.nombreArticles) || 0,
        estimatedAmountEur: Number(orderForm.estimatedAmountEur) || 0,
        estimatedAmountTnd: Number(orderForm.estimatedAmountTnd) || 0,
        insuranceFee: Number(orderForm.insuranceFee) || 0,
        screenshots: orderForm.screenshots,
      });
      setOrders(prev => [res.data, ...prev]);
      setShowOrderModal(false);
      toast.success('Commande créée avec succès.');
    } catch {
      toast.error('Erreur lors de la création de la commande.');
    } finally {
      setSavingOrder(false);
    }
  };

  // Add/remove screenshots on an existing commande, persisted immediately
  const handleDetailScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingDetailScreenshots(true);
    try {
      const uploaded = await uploadImages(files);
      const res = await api.put(`/client-paniers/${selectedOrder._id}`, {
        screenshots: [...(selectedOrder.screenshots || []), ...uploaded],
      });
      setSelectedOrder(res.data);
      setOrders(prev => prev.map(o => o._id === res.data._id ? res.data : o));
    } catch {
      toast.error('Erreur lors du téléversement des images.');
    } finally {
      setUploadingDetailScreenshots(false);
    }
  };

  const handleRemoveDetailScreenshot = async (url) => {
    try {
      const res = await api.put(`/client-paniers/${selectedOrder._id}`, {
        screenshots: (selectedOrder.screenshots || []).filter(s => s !== url),
      });
      setSelectedOrder(res.data);
      setOrders(prev => prev.map(o => o._id === res.data._id ? res.data : o));
    } catch {
      toast.error('Erreur lors de la suppression de la capture.');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.put(`/client-paniers/${orderId}`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? res.data : o));
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(res.data);
      }
      toast.success('Statut mis à jour.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const handleUpdateOrderPricing = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/client-paniers/${selectedOrder._id}`, {
        estimatedAmountEur: Number(selectedOrder.estimatedAmountEur),
        estimatedAmountTnd: Number(selectedOrder.estimatedAmountTnd),
        insuranceFee: Number(selectedOrder.insuranceFee),
      });
      setSelectedOrder(res.data);
      setOrders(prev => prev.map(o => o._id === res.data._id ? res.data : o));
      toast.success('Tarification enregistrée.');
    } catch {
      toast.error('Erreur lors de la modification.');
    }
  };

  const handleAttachPanier = async (panierId) => {
    try {
      const res = await api.put(`/client-paniers/${selectedOrder._id}`, { panier: panierId || null });
      setSelectedOrder(res.data);
      setOrders(prev => prev.map(o => o._id === res.data._id ? res.data : o));
      toast.success(panierId ? 'Commande rattachée au panier.' : 'Commande détachée du panier.');
    } catch {
      toast.error('Erreur lors du rattachement.');
    }
  };

  const handleDeleteOrder = (orderId, e) => {
    e.stopPropagation();
    setPendingDeleteOrder(orderId);
  };

  const handleDeleteOrderConfirm = async () => {
    const orderId = pendingDeleteOrder;
    setPendingDeleteOrder(null);
    setDeletingOrderId(orderId);
    try {
      await api.delete(`/client-paniers/${orderId}`);
      toast.success('Commande supprimée.');
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(null);
      }
      fetchOrders(selectedClient._id);
    } catch {
      toast.error('Erreur lors de la suppression de la commande.');
    } finally {
      setDeletingOrderId(null);
    }
  };

  // Payment log
  const handleAddPayment = async (e) => {
    e.preventDefault();
    setSavingPayment(true);
    try {
      const res = await api.post(`/client-paniers/${selectedOrder._id}/payment`, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method
      });
      setSelectedOrder(res.data);
      setOrders(prev => prev.map(o => o._id === res.data._id ? res.data : o));
      setPaymentForm({ amount: '', method: 'Espèces' });
      setShowPaymentModal(false);
      toast.success('Paiement enregistré.');
    } catch {
      toast.error('Erreur lors de l\'enregistrement du paiement.');
    } finally {
      setSavingPayment(false);
    }
  };

  // Pricing Helpers
  const getOrderPaymentsTotal = (order) => {
    if (!order || !order.paymentHistory) return 0;
    return order.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      'Pending': 'bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900',
      'Partially Paid': 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900',
      'Fully Paid': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-slate-100'}`}>
        {status === 'Pending' ? 'En attente' : status === 'Partially Paid' ? 'Partiellement payé' : 'Payé en totalité'}
      </span>
    );
  };

  // Aggregate payment summary for the currently selected client, computed from their orders
  const clientTotalDue = orders.reduce((sum, o) => sum + o.estimatedAmountTnd + o.insuranceFee, 0);
  const clientTotalPaid = orders.reduce((sum, o) => sum + getOrderPaymentsTotal(o), 0);
  const clientTotalReste = clientTotalDue - clientTotalPaid;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients & Paiements</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez le répertoire client et suivez leurs commandes et paiements.</p>
        </div>
        {!selectedClient && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500 w-56"
              />
            </div>
            <button
              onClick={openCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-2 text-sm font-semibold cursor-pointer shrink-0"
            >
              <Plus size={18} /> Nouveau Client
            </button>
          </div>
        )}
      </div>

      {!selectedClient && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => toggleFilter('isPriority')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filters.isPriority
                ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Star size={13} className={filters.isPriority ? 'fill-amber-500 text-amber-500' : ''} /> Prioritaires
          </button>
          <button
            onClick={() => toggleFilter('dette')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filters.dette
                ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-950/20 dark:border-red-800 dark:text-red-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle size={13} /> En dette
          </button>
          <button
            onClick={() => toggleFilter('closed')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filters.closed
                ? 'bg-slate-200 border-slate-400 text-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Commandes fermées
          </button>
        </div>
      )}

      {/* Main Grid: Client List or Detail View */}
      {!selectedClient ? (
        // CLIENTS LIST VIEW
        loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm py-16 text-center text-slate-500">
            Aucun client enregistré.
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm py-16 text-center text-slate-500">
            Aucun client ne correspond à "{search}".
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <div
                key={client._id}
                onClick={() => handleSelectClient(client)}
                className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-sm p-6 hover:shadow-md cursor-pointer transition-all relative overflow-hidden group hover:-translate-y-0.5 ${
                  client.isPriority
                    ? 'border-amber-300 dark:border-amber-800'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <User size={20} className="text-indigo-500" /> {client.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleTogglePriority(client, e)}
                      className={`transition-colors p-1.5 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 ${
                        client.isPriority ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                      }`}
                      title={client.isPriority ? 'Retirer la priorité' : 'Marquer prioritaire'}
                    >
                      <Star size={16} className={client.isPriority ? 'fill-amber-500' : ''} />
                    </button>
                    <button
                      onClick={(e) => openEdit(client, e)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(client, e)}
                      disabled={deletingId === client._id}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deletingId === client._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" /> {client.phone || 'Aucun téléphone'}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" /> {client.contactInfo || 'Aucune adresse'}
                  </p>
                  {(client.nombreArticles > 0 || client.compteAcheteur) && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      {client.nombreArticles > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {client.nombreArticles} article{client.nombreArticles !== 1 ? 's' : ''}
                        </span>
                      )}
                      {client.compteAcheteur?.label && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {client.compteAcheteur.label}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Payment summary badge */}
                  <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {client.totalReste > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                        <AlertTriangle size={12} /> En dette : {client.totalReste.toLocaleString()} TND
                      </span>
                    ) : client.panierCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                        <CheckCircle2 size={12} /> À jour
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Aucune commande</span>
                    )}
                    {client.panierCount > 0 && (
                      <span className="text-xs text-slate-400">{client.panierCount} commande{client.panierCount !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // CLIENT DETAILS & COMMANDES PAGE
        <div className="space-y-6">
          {/* Back button and Info header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
            <div className="flex items-start gap-4">
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <User className="text-indigo-500" /> {selectedClient.name}
                </h2>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1 flex-wrap">
                  <span className="flex items-center gap-1"><Phone size={14} /> {selectedClient.phone || 'Non renseigné'}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} /> {selectedClient.contactInfo || 'Non renseigné'}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={(e) => openEdit(selectedClient, e)}
                className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Edit size={16} /> Modifier Client
              </button>
              <button
                onClick={openCreateOrder}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ShoppingCart size={16} /> Nouvelle Commande
              </button>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-bold text-lg mb-4">Résumé des Paiements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Total dû</div>
                <div className="text-xl font-black mt-1">{clientTotalDue.toLocaleString()} TND</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Total payé</div>
                <div className="text-xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{clientTotalPaid.toLocaleString()} TND</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Reste à payer</div>
                <div className={`text-xl font-black mt-1 ${clientTotalReste > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {clientTotalReste.toLocaleString()} TND
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">Statut</div>
                <div className="mt-1.5">
                  {clientTotalReste > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                      <AlertTriangle size={12} /> En dette
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                      <CheckCircle2 size={12} /> À jour
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Col: Orders (ClientPanier) List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-bold text-lg text-slate-700 dark:text-slate-350">Commandes de ce Client</h3>
              {loadingOrders ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin text-indigo-500" />
                </div>
              ) : orders.length === 0 ? (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 text-center text-slate-500 text-sm space-y-3">
                  <p>Aucune commande pour ce client pour le moment.</p>
                  <button
                    onClick={openCreateOrder}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:underline cursor-pointer"
                  >
                    + Créer sa première commande
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const isOrderSelected = selectedOrder?._id === order._id;
                    const paid = getOrderPaymentsTotal(order);
                    const total = order.estimatedAmountTnd + order.insuranceFee;
                    return (
                      <div
                        key={order._id}
                        onClick={() => handleSelectOrder(order)}
                        className={`rounded-xl border p-4 cursor-pointer transition-all relative overflow-hidden group ${
                          isOrderSelected
                            ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            order.status === 'Open' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30' :
                            order.status === 'Ordered' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800'
                          }`}>
                            {order.status === 'Open' ? 'Ouvert' : order.status === 'Ordered' ? 'Commandé' : 'Fermé'}
                          </span>
                        </div>
                        <div className="font-bold text-sm mb-1">{order.name}</div>
                        <div className="font-bold text-lg mb-1">{total.toLocaleString()} TND</div>
                        <div className="text-xs text-slate-500 flex justify-between items-center mt-2">
                          <span>Payé: {paid.toLocaleString()} TND</span>
                          <span className="font-semibold text-slate-400">
                            {order.estimatedAmountEur} €
                          </span>
                        </div>
                        <div className="text-xs mt-2 flex items-center gap-1.5 text-slate-400">
                          {order.panier ? (
                            <><Link2 size={11} /> {order.panier.name}</>
                          ) : (
                            <><Unlink size={11} /> Non rattaché à un panier</>
                          )}
                        </div>

                        {/* Quick delete button */}
                        <button
                          onClick={(e) => handleDeleteOrder(order._id, e)}
                          disabled={deletingOrderId === order._id}
                          className="absolute right-2 top-8 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-1.5 rounded-md"
                          title="Supprimer la commande"
                        >
                          {deletingOrderId === order._id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Col: Selected Order details / Payments / Pricing */}
            <div className="lg:col-span-2 space-y-6">
              {selectedOrder ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Order Header details */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <h4 className="text-xl font-bold">{selectedOrder.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Créée le {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={selectedOrder.status}
                          onChange={(e) => handleUpdateOrderStatus(selectedOrder._id, e.target.value)}
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Open" className="dark:bg-slate-900">Ouvert</option>
                          <option value="Ordered" className="dark:bg-slate-900">Commandé</option>
                          <option value="Closed" className="dark:bg-slate-900">Fermé</option>
                        </select>
                        <button
                          onClick={() => setShowAgreement(true)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 dark:text-emerald-400 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText size={14} /> Accord Client
                        </button>
                      </div>
                    </div>

                    {/* Panier attachment */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2">
                        <ShoppingCart size={14} /> Panier rattaché
                      </div>
                      <select
                        value={selectedOrder.panier?._id || ''}
                        onChange={(e) => handleAttachPanier(e.target.value)}
                        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="" className="dark:bg-slate-900">Aucun (non rattaché)</option>
                        {paniers.map(p => (
                          <option key={p._id} value={p._id} className="dark:bg-slate-900">{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Screenshots */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-bold text-slate-650 dark:text-slate-300">Captures d'écran des articles</h5>
                      {selectedOrder.screenshots?.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {selectedOrder.screenshots.map((url) => (
                            <div key={url} className="relative h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                              <img src={url} alt="Capture" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveDetailScreenshot(url)}
                                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all text-sm text-slate-500">
                        {uploadingDetailScreenshots ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <ImageIcon size={16} className="text-slate-400" />}
                        {uploadingDetailScreenshots ? 'Téléversement...' : 'Ajouter des captures'}
                        <input type="file" accept="image/*" multiple onChange={handleDetailScreenshotUpload} disabled={uploadingDetailScreenshots} className="hidden" />
                      </label>
                    </div>

                    {/* Pricing Edit Form */}
                    <form onSubmit={handleUpdateOrderPricing} className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Total (EUR)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={selectedOrder.estimatedAmountEur}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, estimatedAmountEur: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent pl-3 pr-8 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <Euro className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Équivalent (TND)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={selectedOrder.estimatedAmountTnd}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, estimatedAmountTnd: parseInt(e.target.value) || 0 })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent pl-3 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">TND</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Frais d'Assurance (TND)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={selectedOrder.insuranceFee}
                            onChange={(e) => setSelectedOrder({ ...selectedOrder, insuranceFee: parseInt(e.target.value) || 0 })}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent pl-3 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">TND</span>
                        </div>
                      </div>
                      <div className="sm:col-span-3 flex justify-end">
                        <button
                          type="submit"
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Enregistrer les Tarifs
                        </button>
                      </div>
                    </form>

                    {/* Payment Overview */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase">État du Paiement</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            {getOrderPaymentsTotal(selectedOrder).toLocaleString()} / {(selectedOrder.estimatedAmountTnd + selectedOrder.insuranceFee).toLocaleString()} TND
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Coins size={14} /> Enregistrer un Paiement
                      </button>
                    </div>

                    {/* Payment History Log */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-bold text-slate-650 dark:text-slate-300">Historique des transactions</h5>
                      {selectedOrder.paymentHistory.length === 0 ? (
                        <div className="text-xs text-slate-550 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-3 text-center">
                          Aucun paiement enregistré pour cette commande.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-150 dark:divide-slate-800 border border-slate-150 dark:border-slate-850 rounded-xl overflow-hidden bg-white dark:bg-slate-900/50 text-xs">
                          {selectedOrder.paymentHistory.map((pmt, i) => (
                            <div key={pmt._id || i} className="p-3 flex justify-between items-center hover:bg-slate-50/55 dark:hover:bg-slate-850/30 transition-colors">
                              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <CreditCard size={12} className="text-slate-400" />
                                {pmt.method} — {new Date(pmt.date).toLocaleDateString()}
                              </span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">+{pmt.amount.toLocaleString()} TND</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 h-64 flex flex-col justify-center items-center gap-2">
                  <Coins size={36} className="text-slate-350 dark:text-slate-600" />
                  <p className="text-sm font-semibold">Sélectionnez une commande à gauche pour gérer les tarifs et les paiements.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CLIENT CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">
              {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Adresse / Info Contact</label>
                <textarea
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1">Compte acheteur</label>
                  <select
                    value={formData.compteAcheteur}
                    onChange={(e) => setFormData({ ...formData, compteAcheteur: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="" className="dark:bg-slate-800">Aucun</option>
                    {buyerAccounts.map(a => (
                      <option key={a._id} value={a._id} className="dark:bg-slate-800">{a.label}</option>
                    ))}
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
          </div>
        </div>
      )}

      {/* NEW ORDER (ClientPanier) MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">Nouvelle Commande</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom de la commande</label>
                <input
                  type="text"
                  placeholder={`Commande ${new Date().toLocaleDateString('fr-FR')}`}
                  value={orderForm.name}
                  onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Panier (optionnel — s'il fait déjà partie d'un lot)</label>
                <select
                  value={orderForm.panier}
                  onChange={(e) => setOrderForm({ ...orderForm, panier: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" className="dark:bg-slate-800">Aucun / à assigner plus tard</option>
                  {paniers.map(p => (
                    <option key={p._id} value={p._id} className="dark:bg-slate-800">{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Articles</label>
                  <input
                    type="number"
                    min="0"
                    value={orderForm.nombreArticles}
                    onChange={(e) => setOrderForm({ ...orderForm, nombreArticles: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={orderForm.estimatedAmountEur}
                    onChange={(e) => setOrderForm({ ...orderForm, estimatedAmountEur: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total (TND)</label>
                  <input
                    type="number"
                    min="0"
                    value={orderForm.estimatedAmountTnd}
                    onChange={(e) => setOrderForm({ ...orderForm, estimatedAmountTnd: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frais d'assurance (TND)</label>
                <input
                  type="number"
                  min="0"
                  value={orderForm.insuranceFee}
                  onChange={(e) => setOrderForm({ ...orderForm, insuranceFee: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Captures d'écran des articles</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {orderForm.screenshots.map((url) => (
                    <div key={url} className="relative h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={url} alt="Capture" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeOrderFormScreenshot(url)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center justify-center gap-2 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all text-sm text-slate-500">
                  {uploadingOrderScreenshots ? <Loader2 size={18} className="animate-spin text-indigo-500" /> : <ImageIcon size={18} className="text-slate-400" />}
                  {uploadingOrderScreenshots ? 'Téléversement...' : 'Ajouter des captures'}
                  <input type="file" accept="image/*" multiple onChange={handleOrderScreenshotUpload} disabled={uploadingOrderScreenshots} className="hidden" />
                </label>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingOrder || uploadingOrderScreenshots}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {savingOrder && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer la commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6">Enregistrer un Paiement</h2>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Montant versé (TND) *</label>
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="ex: 100"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Méthode de Paiement *</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Espèces">Espèces</option>
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="D17">D17</option>
                  <option value="Chèque">Chèque</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {savingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteClient}
        onClose={() => setPendingDeleteClient(null)}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le client ?"
        message={pendingDeleteClient ? `"${pendingDeleteClient.name}" et toutes ses données seront supprimés.` : ''}
      />

      <ConfirmDialog
        open={!!pendingDeleteOrder}
        onClose={() => setPendingDeleteOrder(null)}
        onConfirm={handleDeleteOrderConfirm}
        title="Supprimer la commande ?"
        message="Cette commande sera définitivement supprimée."
      />

      {/* DETAILED PRINTABLE/SHAREABLE AGREEMENT SUMMARY */}
      {showAgreement && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-xl shadow-2xl p-8 my-8 relative animate-in fade-in zoom-in-95 duration-250">
            {/* Close action */}
            <button
              onClick={() => setShowAgreement(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-full transition-colors print:hidden cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Receipt container (screenshot friendly) */}
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center border-b pb-6 border-slate-100">
                <h2 className="text-2xl font-black text-indigo-650 tracking-tighter uppercase">Malla Forssa</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Courtage & Importation EU → TN</p>
                <h3 className="text-lg font-bold text-slate-800 mt-4">Fiche d'Accord Commande</h3>
                <p className="text-xs text-slate-400 mt-0.5">Date : {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-400 uppercase">Courtier</div>
                  <div className="font-bold mt-1">Malla Forssa TN</div>
                  <div className="text-slate-500">Tunis, Tunisie</div>
                </div>
                <div>
                  <div className="font-bold text-slate-400 uppercase">Client</div>
                  <div className="font-bold mt-1">{selectedClient.name}</div>
                  <div className="text-slate-500">{selectedClient.phone || 'Non renseigné'}</div>
                </div>
              </div>

              {/* Order summary */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase border-b pb-1">Contenu de la Commande</div>
                <div className="flex justify-between items-center text-xs py-2">
                  <span className="font-bold text-slate-800">{selectedOrder.name}</span>
                  <span className="font-medium text-slate-650">{selectedOrder.nombreArticles || 0} article{(selectedOrder.nombreArticles || 0) !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Total calculations */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-sm space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-550">Total Articles (Estimé)</span>
                  <span className="font-bold">{selectedOrder.estimatedAmountEur} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-550">Conversion en Dinars</span>
                  <span className="font-bold">{selectedOrder.estimatedAmountTnd.toLocaleString()} TND</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-slate-550">Frais d'Assurance Commande</span>
                  <span className="font-bold">+{selectedOrder.insuranceFee.toLocaleString()} TND</span>
                </div>
                <div className="flex justify-between items-center pt-1.5">
                  <span className="font-bold text-slate-700">Total Net Dû</span>
                  <span className="text-lg font-black text-indigo-650">{(selectedOrder.estimatedAmountTnd + selectedOrder.insuranceFee).toLocaleString()} TND</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-600 font-semibold pt-1">
                  <span>Acompte Payé</span>
                  <span>-{getOrderPaymentsTotal(selectedOrder).toLocaleString()} TND</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-red-600 pt-1.5 border-t border-dashed">
                  <span>Reste à payer</span>
                  <span>{((selectedOrder.estimatedAmountTnd + selectedOrder.insuranceFee) - getOrderPaymentsTotal(selectedOrder)).toLocaleString()} TND</span>
                </div>
              </div>

              {/* Note / Terms */}
              <div className="text-[10px] text-slate-400 text-center leading-relaxed">
                Les prix en Dinars Tunisiens (TND) intègrent le taux de change, le transport international et le dédouanement. L'assurance couvre la perte et la détérioration de vos colis. En cas de litige, seul le montant déclaré fait foi.
              </div>
            </div>

            {/* Print/Share actions */}
            <div className="mt-8 flex justify-end gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 size={14} /> Imprimer / PDF
              </button>
              <button
                onClick={() => setShowAgreement(false)}
                className="bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
