import React, { useState, useEffect } from 'react';
import { 
  Package, CheckCircle, XCircle, Clock, User, 
  Calendar, AlertCircle, RefreshCw, Search, MapPin,
  CalendarDays, ChevronDown, X, Filter
} from 'lucide-react';
import Pagination from './Pagination';

interface OrderItem {
  item_id: string;
  quantity: number;
  price: number;
  details?: {
    name: string;
    description?: string;
    category: string;
    image_url?: string;
  };
}

interface Order {
  id: string;
  employee_id: string;
  employee_name: string;
  restaurant_id: string;
  items: OrderItem[];
  total_amount: number;
  ticket_amount_used: number;
  status: 'pending' | 'confirmed' | 'rejected';
  delivery_location_id?: number;
  delivery_location?: {
    id: number;
    name: string;
    address?: string;
    building?: string;
    floor?: string;
    instructions?: string;
  };
  delivery_address?: string;
  notes?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface Notification {
  type: 'success' | 'error' | 'info';
  message: string;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const ORDERS_PER_PAGE = 10;

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, selectedStatus, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const baseUrl = 'http://localhost:8001/api';
      
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const userRole = localStorage.getItem('userRole');
      const restaurantId = localStorage.getItem('restaurantId');

      const response = await fetch(`${baseUrl}/restaurant/orders`, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-User-Name': userName || '',
          'X-User-Role': userRole || '',
          'X-User-Restaurant-Id': restaurantId || '',
        },
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('error', 'Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filtrer par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
    setOrderPage(1);
  };

  const handleValidateOrder = async (orderId: string) => {
    try {
      const baseUrl = 'http://localhost:8001/api';
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const restaurantId = localStorage.getItem('restaurantId');

      const response = await fetch(`${baseUrl}/restaurant/orders/${orderId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-User-Name': userName || '',
          'X-User-Restaurant-Id': restaurantId || '',
        },
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', 'Commande validée avec succès');
        loadOrders();
      } else {
        showNotification('error', data.error || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('error', 'Erreur lors de la validation de la commande');
    }
  };

  const handleRejectOrder = async () => {
    if (!orderToReject) return;

    try {
      const baseUrl = 'http://localhost:8001/api';
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const restaurantId = localStorage.getItem('restaurantId');

      const response = await fetch(`${baseUrl}/restaurant/orders/${orderToReject}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-User-Name': userName || '',
          'X-User-Restaurant-Id': restaurantId || '',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();
      if (data.success) {
        showNotification('success', 'Commande rejetée et employé remboursé');
        setShowRejectModal(false);
        setOrderToReject(null);
        setRejectionReason('');
        loadOrders();
      } else {
        showNotification('error', data.error || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('error', 'Erreur lors du rejet de la commande');
    }
  };

  const openRejectModal = (orderId: string) => {
    setOrderToReject(orderId);
    setShowRejectModal(true);
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')}F`;
  };

  const getStatusBadge = (status: string) => {
    const cfg = {
      pending: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400', label: 'En attente' },
      confirmed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400', label: 'Validée' },
      rejected: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-400', label: 'Rejetée' },
    };
    const s = cfg[status as keyof typeof cfg] || cfg.pending;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.bg} ${s.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
        {s.label}
      </span>
    );
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-2xl shadow-lg border p-4 flex items-center gap-3 backdrop-blur-sm ${
            notification.type === 'success' ? 'bg-emerald-50/95 border-emerald-200' :
            notification.type === 'error' ? 'bg-red-50/95 border-red-200' :
            'bg-blue-50/95 border-blue-200'
          }`}>
            {notification.type === 'success' ? (
              <div className="p-1.5 bg-emerald-100 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
            ) : notification.type === 'error' ? (
              <div className="p-1.5 bg-red-100 rounded-lg"><XCircle className="w-4 h-4 text-red-600" /></div>
            ) : (
              <div className="p-1.5 bg-blue-100 rounded-lg"><AlertCircle className="w-4 h-4 text-blue-600" /></div>
            )}
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-emerald-800' :
              notification.type === 'error' ? 'text-red-800' : 'text-blue-800'
            }`}>{notification.message}</p>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors ml-2">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de rejet */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowRejectModal(false); setOrderToReject(null); setRejectionReason(''); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Rejeter la commande</h3>
                  <p className="text-sm text-red-100">L'employé sera remboursé automatiquement</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Raison du rejet (optionnel)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Précisez la raison..."
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setShowRejectModal(false); setOrderToReject(null); setRejectionReason(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRejectOrder}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Validez ou rejetez les commandes reçues</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadOrders} className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Package, iconBg: 'bg-blue-50 text-blue-600', accent: 'border-blue-100' },
          { label: 'En attente', value: stats.pending, icon: Clock, iconBg: 'bg-amber-50 text-amber-600', accent: 'border-amber-100' },
          { label: 'Validées', value: stats.confirmed, icon: CheckCircle, iconBg: 'bg-emerald-50 text-emerald-600', accent: 'border-emerald-100' },
          { label: 'Rejetées', value: stats.rejected, icon: XCircle, iconBg: 'bg-red-50 text-red-600', accent: 'border-red-100' },
        ].map((s, i) => (
          <button
            key={i}
            onClick={() => setSelectedStatus(i === 0 ? 'all' : i === 1 ? 'pending' : i === 2 ? 'confirmed' : 'rejected')}
            className={`bg-white rounded-2xl border shadow-sm p-5 text-left hover:shadow-md transition-all group ${
              (selectedStatus === 'all' && i === 0) || (selectedStatus === 'pending' && i === 1) || (selectedStatus === 'confirmed' && i === 2) || (selectedStatus === 'rejected' && i === 3)
                ? `${s.accent} ring-2 ring-orange-200` : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${s.iconBg} group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par ID ou nom d'employé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300 shadow-sm placeholder:text-gray-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-300 shadow-sm cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Validées</option>
            <option value="rejected">Rejetées</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune commande</h3>
            <p className="text-sm text-gray-400">
              {searchTerm || selectedStatus !== 'all'
                ? 'Aucune commande ne correspond à vos critères'
                : 'Aucune commande reçue pour le moment'}
            </p>
          </div>
        ) : (
          filteredOrders.slice((orderPage - 1) * ORDERS_PER_PAGE, orderPage * ORDERS_PER_PAGE).map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
              <div className="p-5">
                {/* Header de la carte */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Commande</p>
                      <p className="font-mono text-xs font-semibold text-gray-700 mt-0.5">{order.id}</p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-2 bg-orange-50 px-3.5 py-2 rounded-xl border border-orange-100">
                    <span className="text-[10px] uppercase tracking-wider text-orange-400 font-medium">Montant</span>
                    <span className="text-lg font-extrabold text-orange-600">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>

                {/* Contenu en 2 colonnes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  {/* Gauche: Employé + Articles */}
                  <div className="space-y-3">
                    {/* Employé */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{order.employee_name}</p>
                        {order.employee?.email && (
                          <p className="text-xs text-gray-400 truncate">{order.employee.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Articles */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-2">Articles commandés:</p>
                      <div className="space-y-1.5">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {item.details?.name || `Article ${item.item_id}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2.5 ml-3 flex-shrink-0">
                              <span className="text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded font-medium">x{item.quantity}</span>
                              <span className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Droite: Lieu de livraison */}
                  {(order.delivery_location || order.notes || order.delivery_address) && (
                    <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/50 rounded-xl p-4 border border-orange-100/60">
                      {order.delivery_location && (
                        <div className="mb-2.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="p-1 bg-orange-100 rounded-md">
                              <MapPin className="w-3 h-3 text-orange-500" />
                            </div>
                            <p className="text-xs font-bold text-gray-800">
                              {order.delivery_location.name}
                            </p>
                          </div>
                          {(order.delivery_location.building || order.delivery_location.floor) && (
                            <p className="text-xs text-gray-500 ml-7">
                              {order.delivery_location.building && <span>{order.delivery_location.building}</span>}
                              {order.delivery_location.floor && <span> &middot; Étage {order.delivery_location.floor}</span>}
                            </p>
                          )}
                          {order.delivery_location.address && (
                            <p className="text-xs text-gray-500 ml-7 mt-0.5">{order.delivery_location.address}</p>
                          )}
                          {order.delivery_location.instructions && (
                            <div className="ml-7 mt-2 bg-white/60 rounded-lg px-2.5 py-1.5 border border-orange-100/50">
                              <p className="text-xs text-gray-600 italic">{order.delivery_location.instructions}</p>
                            </div>
                          )}
                        </div>
                      )}
                      {order.delivery_address && (
                        <p className="text-xs text-gray-600 mb-1">
                          <span className="font-semibold">Complément:</span> {order.delivery_address}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">Note:</span> {order.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3.5 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(order.created_at)}</span>
                  </div>

                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openRejectModal(order.id)}
                        className="px-4 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeter
                      </button>
                      <button
                        onClick={() => handleValidateOrder(order.id)}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-100"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Valider
                      </button>
                    </div>
                  )}

                  {order.status === 'confirmed' && order.confirmed_by && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Validée par {order.confirmed_by}
                    </div>
                  )}

                  {order.status === 'rejected' && order.rejected_by && (
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-red-500 justify-end">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejetée par {order.rejected_by}
                      </div>
                      {order.rejection_reason && (
                        <p className="text-[11px] text-gray-400 mt-0.5">Raison: {order.rejection_reason}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <Pagination
          currentPage={orderPage}
          totalItems={filteredOrders.length}
          itemsPerPage={ORDERS_PER_PAGE}
          onPageChange={setOrderPage}
        />
      </div>
    </div>
  );
};

export default OrderManagement;
