import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Store, Users, DollarSign, Download, Filter, X } from 'lucide-react';
import { apiService, getRestaurantExpenses, getEmployeeExpenses } from '../services/api';

interface RestaurantExpense {
  restaurant_id: string;
  restaurant_name: string;
  total_amount: number;
  total_orders: number;
  employees_count: number;
}

interface EmployeeExpense {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  total_amount: number;
  total_orders: number;
}

interface ExpensesSummary {
  total_amount: number;
  total_orders: number;
  restaurants_count: number;
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

  // Filtres
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Charger les restaurants
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

  // Charger les données
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedRestaurant, activeView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
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
        setEmployeeExpenses(response);
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

  const exportToCSV = () => {
    const data = activeView === 'restaurants' ? restaurantExpenses : employeeExpenses;
    const headers = activeView === 'restaurants' 
      ? ['Restaurant', 'Montant Total', 'Nombre Commandes', 'Nombre Employés']
      : ['Employé', 'Email', 'Montant Total', 'Nombre Commandes'];

    const rows = data.map((item: any) => {
      if (activeView === 'restaurants') {
        return [
          item.restaurant_name,
          item.total_amount,
          item.total_orders,
          item.employees_count
        ];
      } else {
        return [
          item.employee_name,
          item.employee_email,
          item.total_amount,
          item.total_orders
        ];
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport-depenses-${activeView}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports de Dépenses</h1>
          <p className="text-gray-600 mt-1">Analysez les dépenses de vos employés par restaurant</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && activeView === 'restaurants' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Dépensé</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.total_amount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commandes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.total_orders}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Restaurants</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.restaurants_count}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Moyenne/Commande</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.total_orders > 0 ? Math.round(summary.total_amount / summary.total_orders) : 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('restaurants')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'restaurants'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Store className="w-4 h-4 inline mr-2" />
              Par Restaurant
            </button>
            <button
              onClick={() => setActiveView('employees')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'employees'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Par Employé
            </button>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              hasActiveFilters
                ? 'border-orange-500 bg-orange-50 text-orange-600'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
            {hasActiveFilters && (
              <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                {[startDate, endDate, selectedRestaurant].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Store className="w-4 h-4 inline mr-1" />
                  Restaurant
                </label>
                <select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Tous les restaurants</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des données...</p>
            </div>
          </div>
        ) : (
          <>
            {activeView === 'restaurants' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurant
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commandes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employés
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Moyenne/Commande
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {restaurantExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          Aucune dépense trouvée pour cette période
                        </td>
                      </tr>
                    ) : (
                      restaurantExpenses.map((expense) => (
                        <tr key={expense.restaurant_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                <Store className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {expense.restaurant_name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(expense.total_amount)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm text-gray-900">{expense.total_orders}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm text-gray-900">{expense.employees_count}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm text-gray-600">
                              {formatCurrency(Math.round(expense.total_amount / expense.total_orders))}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employé
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Commandes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Moyenne/Commande
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employeeExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          Aucune dépense trouvée pour cette période
                        </td>
                      </tr>
                    ) : (
                      employeeExpenses.map((expense) => (
                        <tr key={expense.employee_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-blue-600">
                                  {expense.employee_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {expense.employee_name}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{expense.employee_email}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatCurrency(expense.total_amount)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm text-gray-900">{expense.total_orders}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm text-gray-600">
                              {formatCurrency(Math.round(expense.total_amount / expense.total_orders))}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompanyReporting;
