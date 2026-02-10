import React, { useState, useEffect } from 'react';
import { Store, Users, DollarSign, Download, Filter, X, ChevronDown, ChevronUp, Award, ShoppingCart, Clock, BarChart3, User } from 'lucide-react';
import { apiService, getRestaurantExpenses, getEmployeeExpenses } from '../services/api';

interface BreakdownItem {
  restaurant_id?: string;
  restaurant_name?: string;
  employee_id?: string;
  employee_name?: string;
  total_amount: number;
  total_orders: number;
}

interface RecentOrder {
  id: string;
  restaurant_name: string;
  total_amount: number;
  items_count: number;
  created_at: string;
}

interface RestaurantExpense {
  restaurant_id: string;
  restaurant_name: string;
  total_amount: number;
  total_orders: number;
  employees_count: number;
  employee_breakdown?: BreakdownItem[];
}

interface EmployeeExpense {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  total_amount: number;
  total_orders: number;
  average_order?: number;
  last_order_date?: string;
  restaurants_count?: number;
  restaurant_breakdown?: BreakdownItem[];
  recent_orders?: RecentOrder[];
}

interface ExpensesSummary {
  total_amount: number;
  total_orders: number;
  restaurants_count: number;
  employees_count?: number;
  average_per_order?: number;
  average_per_employee?: number;
  period: {
    start_date: string | null;
    end_date: string | null;
  };
}

interface Restaurant {
  id: string;
  name: string;
}

const CompanyReporting: React.FC = () => {
  const [restaurantExpenses, setRestaurantExpenses] = useState<RestaurantExpense[]>([]);
  const [employeeExpenses, setEmployeeExpenses] = useState<EmployeeExpense[]>([]);
  const [summary, setSummary] = useState<ExpensesSummary | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'restaurants' | 'employees'>('restaurants');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filtres
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await apiService.getRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error('Erreur lors du chargement des restaurants:', error);
      }
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedRestaurant, activeView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setExpandedRow(null);
      
      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedRestaurant) params.restaurant_id = selectedRestaurant;

      if (activeView === 'restaurants') {
        const response = await getRestaurantExpenses(params);
        setRestaurantExpenses(response.data.expenses_by_restaurant);
        setSummary(response.data.summary);
      } else {
        const response = await getEmployeeExpenses(params);
        setEmployeeExpenses(response.data?.expenses_by_employee || response.data || response);
        setSummary(response.data?.summary || null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedRestaurant('');
  };

  const hasActiveFilters = startDate || endDate || selectedRestaurant;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + 'F';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMaxAmount = () => {
    if (activeView === 'restaurants' && restaurantExpenses.length > 0) {
      return Math.max(...restaurantExpenses.map(e => e.total_amount));
    }
    if (activeView === 'employees' && employeeExpenses.length > 0) {
      return Math.max(...employeeExpenses.map(e => e.total_amount));
    }
    return 1;
  };

  const exportToCSV = () => {
    const data: any[] = activeView === 'restaurants' ? restaurantExpenses : employeeExpenses;
    const headers = activeView === 'restaurants' 
      ? ['Restaurant', 'Montant Total', 'Nombre Commandes', 'Nombre Employés', 'Moyenne/Commande']
      : ['Employé', 'Email', 'Montant Total', 'Nombre Commandes', 'Moyenne/Commande', 'Restaurants Fréquentés'];

    const rows = data.map((item: any) => {
      if (activeView === 'restaurants') {
        return [item.restaurant_name, item.total_amount, item.total_orders, item.employees_count, item.total_orders > 0 ? Math.round(item.total_amount / item.total_orders) : 0];
      } else {
        return [item.employee_name, item.employee_email, item.total_amount, item.total_orders, item.average_order || 0, item.restaurants_count || 0];
      }
    });

    const csvContent = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `rapport-depenses-${activeView}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxAmount = getMaxAmount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Rapports de Dépenses</h1>
          <p className="text-gray-600">Analyse détaillée des dépenses de vos employés</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Summary Cards - Visible on both tabs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Dépensé</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_amount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Commandes</p>
                <p className="text-lg font-bold text-gray-900">{summary.total_orders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Store className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Restaurants</p>
                <p className="text-lg font-bold text-gray-900">{summary.restaurants_count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Employés</p>
                <p className="text-lg font-bold text-gray-900">{summary.employees_count || '-'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Moy./Commande</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.average_per_order || 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Moy./Employé</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.average_per_employee || 0)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveView('restaurants')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeView === 'restaurants' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Par Restaurant</span>
            </button>
            <button
              onClick={() => setActiveView('employees')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeView === 'employees' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Par Employé</span>
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-colors ${
              hasActiveFilters ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
            {hasActiveFilters && (
              <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {[startDate, endDate, selectedRestaurant].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Date début</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Date fin</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Restaurant</label>
                <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="">Tous les restaurants</option>
                  {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-3 flex justify-end">
                <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  <X className="w-3.5 h-3.5" /> Effacer
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des données...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ============ VUE RESTAURANTS ============ */}
          {activeView === 'restaurants' && (
            <div className="space-y-3">
              {restaurantExpenses.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune dépense</h3>
                  <p className="text-gray-500">Aucune commande validée pour cette période</p>
                </div>
              ) : (
                restaurantExpenses.map((expense, index) => {
                  const isExpanded = expandedRow === expense.restaurant_id;
                  const percentage = maxAmount > 0 ? (expense.total_amount / maxAmount) * 100 : 0;
                  const avgOrder = expense.total_orders > 0 ? Math.round(expense.total_amount / expense.total_orders) : 0;
                  return (
                    <div key={expense.restaurant_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : expense.restaurant_id)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Store className="w-5 h-5 text-orange-600" />
                              </div>
                              {index === 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <Award className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">{expense.restaurant_name}</h3>
                              <p className="text-xs text-gray-500">{expense.employees_count} employé{expense.employees_count > 1 ? 's' : ''} · {expense.total_orders} commande{expense.total_orders > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-base font-bold text-gray-900">{formatCurrency(expense.total_amount)}</p>
                              <p className="text-xs text-gray-500">Moy. {formatCurrency(avgOrder)}/cmd</p>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>

                      {/* Expanded: Employee breakdown */}
                      {isExpanded && expense.employee_breakdown && expense.employee_breakdown.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50 p-5">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Répartition par employé</p>
                          <div className="space-y-2">
                            {expense.employee_breakdown.map((eb) => {
                              const empPct = expense.total_amount > 0 ? (eb.total_amount / expense.total_amount) * 100 : 0;
                              return (
                                <div key={eb.employee_id} className="bg-white rounded-lg p-3 border border-gray-100">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-blue-600">{eb.employee_name?.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                                      </div>
                                      <span className="text-sm font-medium text-gray-900">{eb.employee_name}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <span className="text-xs text-gray-500">{eb.total_orders} cmd</span>
                                      <span className="text-sm font-bold text-gray-900">{formatCurrency(eb.total_amount)}</span>
                                      <span className="text-xs font-medium text-orange-600">{Math.round(empPct)}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${empPct}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ============ VUE EMPLOYÉS ============ */}
          {activeView === 'employees' && (
            <div className="space-y-3">
              {employeeExpenses.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune dépense</h3>
                  <p className="text-gray-500">Aucune commande validée pour cette période</p>
                </div>
              ) : (
                employeeExpenses.map((expense, index) => {
                  const isExpanded = expandedRow === expense.employee_id;
                  const percentage = maxAmount > 0 ? (expense.total_amount / maxAmount) * 100 : 0;
                  return (
                    <div key={expense.employee_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-5 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : expense.employee_id)}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">{expense.employee_name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                              </div>
                              {index === 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <Award className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-gray-900">{expense.employee_name}</h3>
                              <p className="text-xs text-gray-500">{expense.employee_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-base font-bold text-gray-900">{formatCurrency(expense.total_amount)}</p>
                              <div className="flex items-center justify-end space-x-2 text-xs text-gray-500">
                                <span>{expense.total_orders} cmd</span>
                                <span>·</span>
                                <span>{expense.restaurants_count || 0} resto{(expense.restaurants_count || 0) > 1 ? 's' : ''}</span>
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-5">
                          {/* Stats rapides */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                              <p className="text-xs text-gray-500 mb-1">Moyenne/Commande</p>
                              <p className="text-sm font-bold text-orange-600">{formatCurrency(expense.average_order || 0)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                              <p className="text-xs text-gray-500 mb-1">Total Commandes</p>
                              <p className="text-sm font-bold text-blue-600">{expense.total_orders}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                              <p className="text-xs text-gray-500 mb-1">Restaurants</p>
                              <p className="text-sm font-bold text-green-600">{expense.restaurants_count || 0}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                              <p className="text-xs text-gray-500 mb-1">Dernière Commande</p>
                              <p className="text-sm font-bold text-gray-700">
                                {expense.last_order_date ? formatDate(expense.last_order_date) : '-'}
                              </p>
                            </div>
                          </div>

                          {/* Restaurant breakdown */}
                          {expense.restaurant_breakdown && expense.restaurant_breakdown.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Répartition par restaurant</p>
                              <div className="space-y-2">
                                {expense.restaurant_breakdown.map((rb) => {
                                  const restPct = expense.total_amount > 0 ? (rb.total_amount / expense.total_amount) * 100 : 0;
                                  return (
                                    <div key={rb.restaurant_id} className="bg-white rounded-lg p-3 border border-gray-100">
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <Store className="w-3.5 h-3.5 text-orange-600" />
                                          </div>
                                          <span className="text-sm font-medium text-gray-900">{rb.restaurant_name}</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                          <span className="text-xs text-gray-500">{rb.total_orders} cmd</span>
                                          <span className="text-sm font-bold text-gray-900">{formatCurrency(rb.total_amount)}</span>
                                          <span className="text-xs font-medium text-orange-600">{Math.round(restPct)}%</span>
                                        </div>
                                      </div>
                                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${restPct}%` }}></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Recent orders */}
                          {expense.recent_orders && expense.recent_orders.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Dernières commandes</p>
                              <div className="space-y-2">
                                {expense.recent_orders.map((order) => (
                                  <div key={order.id} className="bg-white rounded-lg p-3 border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                        <ShoppingCart className="w-3.5 h-3.5 text-green-600" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">{order.restaurant_name}</p>
                                        <p className="text-xs text-gray-500 flex items-center space-x-1">
                                          <Clock className="w-3 h-3" />
                                          <span>{formatDate(order.created_at)}</span>
                                          <span>· {order.items_count} article{order.items_count > 1 ? 's' : ''}</span>
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CompanyReporting;
