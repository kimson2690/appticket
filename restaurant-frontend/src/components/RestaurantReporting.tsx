import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Building2, Users, ShoppingCart, Download, Filter, X, CheckCircle, Clock, XCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface CompanyOrder {
  company_id: string;
  company_name: string;
  total_orders: number;
  confirmed_orders: number;
  pending_orders: number;
  rejected_orders: number;
  total_amount: number;
  employees_count: number;
}

interface EmployeeOrder {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  company_id: string;
  total_orders: number;
  confirmed_orders: number;
  pending_orders: number;
  rejected_orders: number;
  total_amount: number;
}

interface OrdersSummary {
  total_orders: number;
  confirmed_orders: number;
  pending_orders: number;
  rejected_orders: number;
  total_amount: number;
  companies_count: number;
  period: {
    start_date: string | null;
    end_date: string | null;
  };
}

interface Company {
  id: string;
  name: string;
}

const RestaurantReporting: React.FC = () => {
  const [companyOrders, setCompanyOrders] = useState<CompanyOrder[]>([]);
  const [employeeOrders, setEmployeeOrders] = useState<EmployeeOrder[]>([]);
  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'companies' | 'employees'>('companies');

  // Filtres
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Charger les entreprises
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await apiService.getCompanies();
        setCompanies(data);
      } catch (error) {
        console.error('Erreur lors du chargement des entreprises:', error);
      }
    };

    fetchCompanies();
  }, []);

  // Charger les données
  useEffect(() => {
    fetchData();
  }, [startDate, endDate, selectedCompany, activeView]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Vérifier que l'utilisateur a un restaurant_id
      const restaurantId = localStorage.getItem('restaurantId') || localStorage.getItem('userRestaurantId');
      if (!restaurantId) {
        console.error('Restaurant ID manquant - Vérifiez que l\'utilisateur est bien un gestionnaire de restaurant');
        setLoading(false);
        return;
      }

      const params: any = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedCompany) params.company_id = selectedCompany;

      const queryParams = new URLSearchParams();
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.company_id) queryParams.append('company_id', params.company_id);

      if (activeView === 'companies') {
        const url = `http://localhost:8001/api/restaurant/reports/company-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Restaurant-Id': restaurantId,
            'X-User-Role': localStorage.getItem('userRole') || '',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Erreur API:', error);
          throw new Error(error.error || 'Erreur lors du chargement');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setCompanyOrders(result.data.orders_by_company || []);
          setSummary(result.data.summary || null);
        }
      } else {
        const url = `http://localhost:8001/api/restaurant/reports/employee-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'X-User-Restaurant-Id': restaurantId,
            'X-User-Role': localStorage.getItem('userRole') || '',
          },
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Erreur API:', error);
          throw new Error(error.error || 'Erreur lors du chargement');
        }

        const result = await response.json();
        if (result.success && result.data) {
          setEmployeeOrders(result.data || []);
        }
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
    setSelectedCompany('');
  };

  const hasActiveFilters = startDate || endDate || selectedCompany;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + 'F';
  };

  const exportToCSV = () => {
    const data = activeView === 'companies' ? companyOrders : employeeOrders;
    const headers = activeView === 'companies' 
      ? ['Entreprise', 'Total Commandes', 'Validées', 'En Attente', 'Rejetées', 'Montant Total', 'Employés']
      : ['Employé', 'Email', 'Total Commandes', 'Validées', 'En Attente', 'Rejetées', 'Montant Total'];

    const rows = data.map((item: any) => {
      if (activeView === 'companies') {
        return [
          item.company_name,
          item.total_orders,
          item.confirmed_orders,
          item.pending_orders,
          item.rejected_orders,
          item.total_amount,
          item.employees_count
        ];
      } else {
        return [
          item.employee_name,
          item.employee_email,
          item.total_orders,
          item.confirmed_orders,
          item.pending_orders,
          item.rejected_orders,
          item.total_amount
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
    link.setAttribute('download', `rapport-commandes-${activeView}-${new Date().toISOString().split('T')[0]}.csv`);
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
          <h1 className="text-3xl font-bold text-gray-900">Rapports de Commandes</h1>
          <p className="text-gray-600 mt-1">Analysez les commandes reçues par entreprise</p>
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
      {summary && activeView === 'companies' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commandes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.total_orders}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Validées</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {summary.confirmed_orders}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Attente</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {summary.pending_orders}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejetées</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {summary.rejected_orders}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Chiffre d'Affaires</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(summary.total_amount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
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
              onClick={() => setActiveView('companies')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'companies'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Par Entreprise
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
                {[startDate, endDate, selectedCompany].filter(Boolean).length}
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
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Entreprise
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Toutes les entreprises</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
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
            {activeView === 'companies' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entreprise
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validées
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        En Attente
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rejetées
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chiffre d'Affaires
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employés
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {companyOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          Aucune commande trouvée pour cette période
                        </td>
                      </tr>
                    ) : (
                      companyOrders.map((order) => (
                        <tr key={order.company_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {order.company_name}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {order.total_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {order.confirmed_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {order.pending_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {order.rejected_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-orange-600">
                              {formatCurrency(order.total_amount)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-sm text-gray-900">{order.employees_count}</p>
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
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validées
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        En Attente
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rejetées
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employeeOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          Aucune commande trouvée pour cette période
                        </td>
                      </tr>
                    ) : (
                      employeeOrders.map((order) => (
                        <tr key={order.employee_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-blue-600">
                                  {order.employee_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-900">
                                {order.employee_name}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600">{order.employee_email}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {order.total_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {order.confirmed_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {order.pending_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {order.rejected_orders}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-semibold text-orange-600">
                              {formatCurrency(order.total_amount)}
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

export default RestaurantReporting;
