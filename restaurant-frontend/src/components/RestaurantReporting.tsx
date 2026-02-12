import React, { useState, useEffect } from 'react';
import { TrendingUp, Building2, Users, ShoppingCart, Download, Filter, X, CheckCircle, Clock, XCircle, CalendarDays, ChevronDown } from 'lucide-react';
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
    const csvHeaders = activeView === 'companies' 
      ? ['Entreprise', 'Total Commandes', 'Validées', 'En Attente', 'Rejetées', 'Montant Total', 'Employés']
      : ['Employé', 'Email', 'Total Commandes', 'Validées', 'En Attente', 'Rejetées', 'Montant Total'];

    const rows = data.map((item: any) => {
      if (activeView === 'companies') {
        return [item.company_name, item.total_orders, item.confirmed_orders, item.pending_orders, item.rejected_orders, item.total_amount, item.employees_count];
      } else {
        return [item.employee_name, item.employee_email, item.total_orders, item.confirmed_orders, item.pending_orders, item.rejected_orders, item.total_amount];
      }
    });

    const csvContent = [csvHeaders.join(','), ...rows.map(row => row.join(','))].join('\n');
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

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports de Commandes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Analysez les commandes reçues par entreprise</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{dateStr}</span>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && activeView === 'companies' && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Commandes', value: summary.total_orders, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
            { label: 'Validées', value: summary.confirmed_orders, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'En Attente', value: summary.pending_orders, icon: Clock, color: 'bg-amber-50 text-amber-600' },
            { label: 'Rejetées', value: summary.rejected_orders, icon: XCircle, color: 'bg-red-50 text-red-600' },
            { label: "Chiffre d'Affaires", value: formatCurrency(summary.total_amount), icon: TrendingUp, color: 'bg-orange-50 text-orange-600', isText: true },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                  <p className={`mt-1 font-extrabold ${(s as any).isText ? 'text-xl text-orange-600' : 'text-3xl text-gray-900'}`}>
                    {s.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${s.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* View Toggle */}
        <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveView('companies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'companies'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Par Entreprise
          </button>
          <button
            onClick={() => setActiveView('employees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'employees'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Par Employé
          </button>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            hasActiveFilters
              ? 'border-orange-300 bg-orange-50 text-orange-600'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 shadow-sm'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
          {hasActiveFilters && (
            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {[startDate, endDate, selectedCompany].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Date début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Date fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Entreprise</label>
              <div className="relative">
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300 pr-10"
                >
                  <option value="">Toutes les entreprises</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
                <X className="w-3.5 h-3.5" />
                Effacer les filtres
              </button>
            </div>
          )}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-3">
                <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-sm text-gray-400 font-medium">Chargement des données...</p>
            </div>
          </div>
        ) : (
          <>
            {activeView === 'companies' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Entreprise</th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Validées</th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">En Attente</th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rejetées</th>
                      <th className="px-4 py-4 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Chiffre d'Affaires</th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Employés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Building2 className="w-6 h-6 text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-400 font-medium">Aucune commande trouvée pour cette période</p>
                        </td>
                      </tr>
                    ) : (
                      companyOrders.map((order, idx) => (
                        <tr key={order.company_id} className={`hover:bg-orange-50/30 transition-colors ${idx !== companyOrders.length - 1 ? 'border-b border-gray-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-blue-500" />
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{order.company_name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-sm font-bold text-gray-900">{order.total_orders}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              {order.confirmed_orders}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                              {order.pending_orders}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                              {order.rejected_orders}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-bold text-orange-600">{formatCurrency(order.total_amount)}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-sm text-gray-600 font-medium">{order.employees_count}</span>
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
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Employé</th>
                      <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Validées</th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">En Attente</th>
                      <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rejetées</th>
                      <th className="px-4 py-4 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Montant Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-gray-300" />
                          </div>
                          <p className="text-sm text-gray-400 font-medium">Aucune commande trouvée pour cette période</p>
                        </td>
                      </tr>
                    ) : (
                      employeeOrders.map((order, idx) => (
                        <tr key={order.employee_id} className={`hover:bg-orange-50/30 transition-colors ${idx !== employeeOrders.length - 1 ? 'border-b border-gray-50' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-orange-600">
                                  {order.employee_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{order.employee_name}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-xs text-gray-400">{order.employee_email}</p>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-sm font-bold text-gray-900">{order.total_orders}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                              {order.confirmed_orders}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                              {order.pending_orders}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-100">
                              {order.rejected_orders}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-sm font-bold text-orange-600">{formatCurrency(order.total_amount)}</span>
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
