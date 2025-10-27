import React, { useState, useEffect } from 'react';
import { 
  Package, CheckCircle, XCircle, Clock, User, 
  DollarSign, Calendar, AlertCircle, RefreshCw, Search, MapPin
} from 'lucide-react';

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
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: 'En attente',
      confirmed: 'Validée',
      rejected: 'Rejetée',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 ${
            notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
            notification.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
            'bg-blue-50 border-l-4 border-blue-500'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : notification.type === 'error' ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-600" />
            )}
            <p className={`text-sm font-medium ${
              notification.type === 'success' ? 'text-green-800' :
              notification.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Modal de rejet */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4 mx-auto">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Rejeter la commande
            </h3>
            <p className="text-gray-600 text-center mb-6">
              L'employé sera remboursé automatiquement. Précisez la raison du rejet (optionnel).
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Raison du rejet (optionnel)"
              className="w-full border border-gray-300 rounded-lg p-3 mb-6 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setOrderToReject(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRejectOrder}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="mt-2 text-gray-600">Validez ou rejetez les commandes reçues</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Validées</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejetées</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par ID ou nom d'employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Validées</option>
              <option value="rejected">Rejetées</option>
            </select>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande</h3>
              <p className="text-gray-500">
                {searchTerm || selectedStatus !== 'all'
                  ? 'Aucune commande ne correspond à vos critères'
                  : 'Aucune commande reçue pour le moment'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all">
                <div className="p-4">
                  {/* En-tête compact */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        <p className="text-xs text-gray-500">Commande</p>
                        <p className="font-mono text-xs font-medium text-gray-900">{order.id}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                      <p className="text-xs text-gray-500">Montant</p>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(order.total_amount)}</p>
                    </div>
                  </div>

                  {/* Grid à 2 colonnes pour compacter */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                    {/* Colonne gauche: Employé + Articles */}
                    <div className="space-y-3">
                      {/* Employé inline compact */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{order.employee_name}</p>
                          {order.employee?.email && (
                            <p className="text-xs text-gray-500 truncate">{order.employee.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Articles compacts */}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1.5">Articles commandés:</p>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate text-sm">
                                  {item.details?.name || `Article ${item.item_id}`}
                                </p>
                                {item.details?.category && (
                                  <p className="text-xs text-gray-500">{item.details.category}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                <span className="text-xs text-gray-600">x{item.quantity}</span>
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Colonne droite: Lieu de livraison */}
                    {(order.delivery_location || order.notes || order.delivery_address) && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        {order.delivery_location && (
                          <div className="mb-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                              <p className="text-xs font-semibold text-gray-700">
                                {order.delivery_location.name}
                                {order.delivery_location.building && <span className="text-gray-600"> • {order.delivery_location.building}</span>}
                                {order.delivery_location.floor && <span className="text-gray-600"> • Étage {order.delivery_location.floor}</span>}
                              </p>
                            </div>
                            {order.delivery_location.address && (
                              <p className="text-xs text-gray-600 ml-5">{order.delivery_location.address}</p>
                            )}
                            {order.delivery_location.instructions && (
                              <p className="text-xs text-gray-500 ml-5 mt-1 italic">📝 {order.delivery_location.instructions}</p>
                            )}
                          </div>
                        )}
                        {order.delivery_address && (
                          <p className="text-xs text-gray-700 mb-1">
                            <span className="font-medium">Complément: </span>
                            {order.delivery_address}
                          </p>
                        )}
                        {order.notes && (
                          <p className="text-xs text-gray-700">
                            <span className="font-medium">Note: </span>
                            {order.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer compact */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(order.created_at)}</span>
                    </div>

                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openRejectModal(order.id)}
                          className="px-3 py-1.5 border border-red-300 text-red-700 text-xs font-medium rounded-md hover:bg-red-50 transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejeter</span>
                        </button>
                        <button
                          onClick={() => handleValidateOrder(order.id)}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Valider</span>
                        </button>
                      </div>
                    )}

                    {order.status === 'confirmed' && order.confirmed_by && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Validée par {order.confirmed_by}
                      </p>
                    )}

                    {order.status === 'rejected' && order.rejected_by && (
                      <div className="text-right">
                        <p className="text-sm text-red-600">
                          Rejetée par {order.rejected_by}
                        </p>
                        {order.rejection_reason && (
                          <p className="text-xs text-gray-500 mt-1">
                            Raison: {order.rejection_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
