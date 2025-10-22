import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Utensils, 
  CreditCard,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { apiService, type Statistics } from '../services/api';

const StatisticsDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getStatistics();
      setStatistics(data);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadStatistics}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistiques Globales</h1>
          <p className="text-gray-600">Vue d'ensemble de votre plateforme AppTicket</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-500">
            Dernière mise à jour : {new Date(statistics.generated_at).toLocaleString('fr-FR')}
          </div>
          <button
            onClick={loadStatistics}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.overview.total_users}</p>
              <p className="text-xs text-green-600 mt-1">
                {statistics.overview.active_users} actifs
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entreprises</p>
              <p className="text-2xl font-bold text-green-600">{statistics.overview.total_companies}</p>
              <p className="text-xs text-green-600 mt-1">
                {statistics.overview.active_companies} actives
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Restaurants</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.overview.total_restaurants}</p>
              <p className="text-xs text-green-600 mt-1">
                {statistics.overview.active_restaurants} actifs
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Utensils className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-orange-600">{statistics.overview.total_ticket_balance.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">
                {statistics.overview.total_employees} employés
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Users by Role */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Utilisateurs par Rôle</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Administrateurs</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{statistics.users_by_role.administrators}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Gestionnaires</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{statistics.users_by_role.managers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Employés</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{statistics.users_by_role.employees}</span>
            </div>
          </div>
        </div>

        {/* Ticket Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Distribution des Tickets</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {statistics.ticket_distribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Companies Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Statistiques par Entreprise</h3>
          <Building2 className="h-5 w-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Entreprise</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Employés</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actifs</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Total Tickets</th>
              </tr>
            </thead>
            <tbody>
              {statistics.companies_stats.map((company, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">{company.company_name}</td>
                  <td className="py-3 px-4 text-gray-600">{company.employee_count}</td>
                  <td className="py-3 px-4 text-green-600">{company.active_employees}</td>
                  <td className="py-3 px-4 text-orange-600 font-medium">{company.total_tickets.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Statistiques par Département</h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statistics.department_stats.map((dept, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{dept.department}</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Employés:</span>
                  <span className="font-medium">{dept.employee_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tickets:</span>
                  <span className="font-medium text-orange-600">{dept.total_tickets.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Stats Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Évolution Mensuelle</h3>
          <TrendingUp className="h-5 w-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mois</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Utilisateurs</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tickets</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Commandes</th>
              </tr>
            </thead>
            <tbody>
              {statistics.monthly_stats.map((month, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">{month.month}</td>
                  <td className="py-3 px-4 text-blue-600">{month.users}</td>
                  <td className="py-3 px-4 text-orange-600">{month.tickets.toLocaleString()}</td>
                  <td className="py-3 px-4 text-green-600">{month.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
