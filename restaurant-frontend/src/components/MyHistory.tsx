import React, { useState, useEffect } from 'react';
import { History, Package, ShoppingCart, CheckCircle, XCircle, Clock, MapPin, ChevronDown, ChevronUp, Utensils, Ticket, CalendarDays } from 'lucide-react';

interface TicketAssignment {
  id: string;
  employee_name: string;
  tickets_count: number;
  ticket_value: number;
  type: 'manual' | 'batch';
  assigned_by: string;
  notes?: string;
  batch_number?: string;
  created_at: string;
}

interface OrderItem {
  item_id: string;
  name?: string;
  quantity: number;
  price: number;
  restaurant_name?: string;
}

interface OrderData {
  id: string;
  employee_name: string;
  restaurant_id: string;
  items: OrderItem[];
  total_amount: number;
  ticket_amount_used: number;
  status: 'pending' | 'confirmed' | 'rejected';
  delivery_location_id?: number;
  delivery_address?: string;
  notes?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  restaurant?: {
    id: string;
    name: string;
  };
  delivery_location?: {
    id: number;
    name: string;
    address?: string;
    building?: string;
    floor?: string;
  };
}

const MyHistory: React.FC = () => {
  const [history, setHistory] = useState<TicketAssignment[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'tickets'>('orders');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'confirmed' | 'rejected' | 'pending'>('all');

  const baseUrl = 'http://localhost:8001/api';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': userId || '',
        'X-User-Name': userName || '',
      };

      const [historyRes, ordersRes] = await Promise.all([
        fetch(`${baseUrl}/employee/ticket-history`, { headers }),
        fetch(`${baseUrl}/employee/orders`, { headers }),
      ]);

      const historyData = await historyRes.json();
      const ordersData = await ordersRes.json();

      if (historyData.success) setHistory(historyData.data);
      if (ordersData.success) setOrders(ordersData.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + 'F';
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          label: 'Validée',
          icon: <CheckCircle className="w-4 h-4" />,
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-700',
          dot: 'bg-green-500',
        };
      case 'rejected':
        return {
          label: 'Rejetée',
          icon: <XCircle className="w-4 h-4" />,
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-700',
          dot: 'bg-red-500',
        };
      default:
        return {
          label: 'En attente',
          icon: <Clock className="w-4 h-4" />,
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-700',
          dot: 'bg-yellow-500',
        };
    }
  };

  const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
  const rejectedOrders = orders.filter(o => o.status === 'rejected').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter(o => o.status === orderFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Historique</h1>
        <p className="text-gray-600">Consultez vos commandes et affectations de tickets</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            activeTab === 'orders'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Commandes</span>
          <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'orders' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
          }`}>
            {orders.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            activeTab === 'tickets'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Affectations Tickets</span>
          <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
            activeTab === 'tickets' ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'
          }`}>
            {history.length}
          </span>
        </button>
      </div>

      {/* ============ TAB: COMMANDES ============ */}
      {activeTab === 'orders' && (
        <div>
          {/* Stats rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setOrderFilter('all')}
              className={`text-left rounded-xl p-4 border shadow-sm transition-all duration-200 ${
                orderFilter === 'all'
                  ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200'
                  : 'bg-white border-gray-100 hover:border-gray-300'
              }`}
            >
              <p className="text-xs text-gray-500 mb-1">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </button>
            <button
              onClick={() => setOrderFilter('confirmed')}
              className={`text-left rounded-xl p-4 border shadow-sm transition-all duration-200 ${
                orderFilter === 'confirmed'
                  ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
                  : 'bg-white border-green-100 hover:border-green-300'
              }`}
            >
              <p className="text-xs text-green-600 mb-1">Validées</p>
              <p className="text-2xl font-bold text-green-600">{confirmedOrders}</p>
            </button>
            <button
              onClick={() => setOrderFilter('rejected')}
              className={`text-left rounded-xl p-4 border shadow-sm transition-all duration-200 ${
                orderFilter === 'rejected'
                  ? 'bg-red-50 border-red-300 ring-2 ring-red-200'
                  : 'bg-white border-red-100 hover:border-red-300'
              }`}
            >
              <p className="text-xs text-red-600 mb-1">Rejetées</p>
              <p className="text-2xl font-bold text-red-600">{rejectedOrders}</p>
            </button>
            <button
              onClick={() => setOrderFilter('pending')}
              className={`text-left rounded-xl p-4 border shadow-sm transition-all duration-200 ${
                orderFilter === 'pending'
                  ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200'
                  : 'bg-white border-yellow-100 hover:border-yellow-300'
              }`}
            >
              <p className="text-xs text-yellow-600 mb-1">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
              <div className="text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {orderFilter === 'all' ? 'Aucune commande' : `Aucune commande ${orderFilter === 'confirmed' ? 'validée' : orderFilter === 'rejected' ? 'rejetée' : 'en attente'}`}
                </h3>
                <p className="text-gray-500">
                  {orderFilter === 'all'
                    ? "Vous n'avez pas encore passé de commande"
                    : 'Essayez un autre filtre'}
                </p>
                {orderFilter !== 'all' && (
                  <button
                    onClick={() => setOrderFilter('all')}
                    className="mt-4 px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    Voir toutes les commandes
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const isExpanded = expandedOrder === order.id;
                return (
                  <div key={order.id} className={`bg-white rounded-2xl shadow-sm border ${statusConfig.border} overflow-hidden transition-all duration-200 hover:shadow-md`}>
                    {/* Order Header - Always visible */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig.bg}`}>
                            <Utensils className={`w-6 h-6 ${statusConfig.text}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-base font-bold text-gray-900">
                                {order.restaurant?.name || 'Restaurant'}
                              </h3>
                              <span className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.badge}`}>
                                {statusConfig.icon}
                                <span>{statusConfig.label}</span>
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span>{formatShortDate(order.created_at)}</span>
                              </span>
                              <span>#{order.id.substring(0, 8)}</span>
                              <span>{order.items?.length || 0} article{(order.items?.length || 0) > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className={`border-t ${statusConfig.border} ${statusConfig.bg} p-5`}>
                        {/* Articles */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Articles commandés</p>
                          <div className="space-y-2">
                            {order.items?.map((item, index) => (
                              <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center space-x-3">
                                  <span className="w-7 h-7 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-xs font-bold">
                                    {item.quantity}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">{item.name || 'Article'}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  {formatCurrency(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Infos complémentaires */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {/* Lieu de livraison */}
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <p className="text-xs text-gray-500">Lieu de livraison</p>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.delivery_location?.name || order.delivery_address || 'À récupérer'}
                            </p>
                            {order.delivery_location?.address && (
                              <p className="text-xs text-gray-500 mt-0.5">{order.delivery_location.address}</p>
                            )}
                          </div>

                          {/* Montant */}
                          <div className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Tickets utilisés</p>
                            <p className="text-sm font-bold text-orange-600">{formatCurrency(order.ticket_amount_used)}</p>
                          </div>
                        </div>

                        {/* Status details */}
                        {order.status === 'confirmed' && order.confirmed_at && (
                          <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <p className="text-sm text-green-800">
                                <span className="font-semibold">Validée</span> le {formatDate(order.confirmed_at)}
                                {order.confirmed_by && <span> par {order.confirmed_by}</span>}
                              </p>
                            </div>
                          </div>
                        )}

                        {order.status === 'rejected' && (
                          <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                              <div>
                                <p className="text-sm text-red-800">
                                  <span className="font-semibold">Rejetée</span>
                                  {order.rejected_at && <span> le {formatDate(order.rejected_at)}</span>}
                                  {order.rejected_by && <span> par {order.rejected_by}</span>}
                                </p>
                                {order.rejection_reason && (
                                  <p className="text-sm text-red-700 mt-1">
                                    Raison : {order.rejection_reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {order.status === 'pending' && (
                          <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-yellow-600" />
                              <p className="text-sm text-yellow-800 font-medium">En attente de validation par le restaurant</p>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {order.notes && (
                          <div className="mt-3 bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-700">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: AFFECTATIONS TICKETS ============ */}
      {activeTab === 'tickets' && (
        <div>
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
              <div className="text-center">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun historique</h3>
                <p className="text-gray-500">Vous n'avez pas encore reçu de tickets</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((assignment) => (
                <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:border-orange-200 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        assignment.type === 'batch' ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        <Package className={`w-6 h-6 ${
                          assignment.type === 'batch' ? 'text-purple-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            +{assignment.tickets_count} ticket{assignment.tickets_count > 1 ? 's' : ''}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            assignment.type === 'batch' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {assignment.type === 'batch' ? 'Affectation groupée' : 'Affectation manuelle'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Valeur totale</p>
                            <p className="text-sm font-semibold text-orange-600">
                              {formatCurrency(assignment.ticket_value * assignment.tickets_count)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Date d'affectation</p>
                            <p className="text-sm font-medium text-gray-700">{formatDate(assignment.created_at)}</p>
                          </div>
                        </div>

                        {assignment.batch_number && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Numéro de souche</p>
                            <p className="text-sm font-mono font-medium text-gray-700">{assignment.batch_number}</p>
                          </div>
                        )}

                        {assignment.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Note</p>
                            <p className="text-sm text-gray-700">{assignment.notes}</p>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Affecté par <span className="font-medium text-gray-700">{assignment.assigned_by}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl px-4 py-2">
                        <p className="text-xs text-orange-600 font-medium mb-1">Valeur unitaire</p>
                        <p className="text-xl font-bold text-orange-700">{formatCurrency(assignment.ticket_value)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyHistory;
