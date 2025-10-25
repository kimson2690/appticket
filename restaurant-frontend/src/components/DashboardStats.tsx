import React, { useState, useEffect } from 'react';
import { getDashboardStats, type DashboardStatsData } from '../services/api';
import { 
  Users, Building2, Store, ShoppingCart, TrendingUp, 
  DollarSign, Package, BarChart3, PieChart, Activity,
  Ticket
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRole = localStorage.getItem('userRole') || '';

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      console.log('📊 [DashboardStats] Chargement des statistiques...');
      console.log('📊 [DashboardStats] Role:', userRole);
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      console.log('📊 [DashboardStats] Données reçues:', data);
      setStats(data);
    } catch (err) {
      console.error('❌ [DashboardStats] Erreur:', err);
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'decimal',
      minimumFractionDigits: 0 
    }).format(amount) + 'F';
  };

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error || 'Erreur lors du chargement des statistiques'}
      </div>
    );
  }

  // Cartes de statistiques selon le rôle
  const renderOverviewCards = () => {
    const overview = stats.overview;
    
    if (userRole === 'Administrateur') {
      return (
        <>
          <StatCard
            title="Total Utilisateurs"
            value={formatNumber(overview.total_users || 0)}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Entreprises"
            value={formatNumber(overview.total_companies || 0)}
            icon={<Building2 className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Restaurants"
            value={formatNumber(overview.total_restaurants || 0)}
            icon={<Store className="w-6 h-6" />}
            color="purple"
          />
          <StatCard
            title="Commandes Totales"
            value={formatNumber(overview.total_orders || 0)}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="orange"
          />
        </>
      );
    } else if (userRole === 'Gestionnaire Entreprise') {
      return (
        <>
          <StatCard
            title="Employés"
            value={formatNumber(overview.total_employees || 0)}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Total Dépensé"
            value={formatCurrency(overview.total_spent || 0)}
            icon={<DollarSign className="w-6 h-6" />}
            color="orange"
          />
          <StatCard
            title="Commandes"
            value={formatNumber(overview.total_orders || 0)}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Taux d'Utilisation"
            value={`${overview.tickets_usage_rate || 0}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
        </>
      );
    } else if (userRole === 'Gestionnaire Restaurant') {
      return (
        <>
          <StatCard
            title="Commandes"
            value={formatNumber(overview.total_orders || 0)}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Chiffre d'Affaires"
            value={formatCurrency(overview.total_revenue || 0)}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Panier Moyen"
            value={formatCurrency(overview.average_order_value || 0)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
          />
        </>
      );
    } else {
      // Employé
      return (
        <>
          <StatCard
            title="Mes Commandes"
            value={formatNumber(overview.total_orders || 0)}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Total Dépensé"
            value={formatCurrency(overview.total_spent || 0)}
            icon={<DollarSign className="w-6 h-6" />}
            color="orange"
          />
          <StatCard
            title="Tickets Reçus"
            value={formatNumber(overview.tickets_assigned || 0)}
            icon={<Ticket className="w-6 h-6" />}
            color="green"
          />
        </>
      );
    }
  };

  // Graphiques selon le rôle
  const renderCharts = () => {
    if (userRole === 'Administrateur') {
      return (
        <>
          {/* Commandes par mois */}
          {stats.orders_by_month && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                Commandes par Mois
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.orders_by_month}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#f97316" name="Commandes" />
                  <Bar dataKey="amount" fill="#3b82f6" name="Montant (F)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top restaurants */}
          {stats.top_restaurants && stats.top_restaurants.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" />
                Top 5 Restaurants
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.top_restaurants} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="restaurant_name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue (F)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      );
    } else if (userRole === 'Gestionnaire Entreprise') {
      return (
        <>
          {/* Dépenses mensuelles */}
          {stats.monthly_expenses && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Évolution des Dépenses
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthly_expenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#f97316" name="Montant (F)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Dépenses par restaurant */}
          {stats.expenses_by_restaurant && stats.expenses_by_restaurant.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-orange-500" />
                Dépenses par Restaurant
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={stats.expenses_by_restaurant}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {stats.expenses_by_restaurant.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}
        </>
      );
    } else if (userRole === 'Gestionnaire Restaurant') {
      return (
        <>
          {/* Commandes par mois */}
          {stats.orders_by_month && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                Commandes et Revenus Mensuels
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.orders_by_month}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#3b82f6" name="Commandes" />
                  <Bar dataKey="amount" fill="#10b981" name="Montant (F)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top plats */}
          {stats.top_dishes && stats.top_dishes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-500" />
                Top 10 Plats Commandés
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.top_dishes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#f97316" name="Quantité" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      );
    } else {
      // Employé
      return (
        <>
          {/* Utilisation mensuelle */}
          {stats.monthly_usage && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Mon Utilisation Mensuelle
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.monthly_usage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#f97316" name="Montant (F)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Restaurants favoris */}
          {stats.favorite_restaurants && stats.favorite_restaurants.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-500" />
                Mes Restaurants Favoris
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.favorite_restaurants}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#3b82f6" name="Commandes" />
                  <Bar dataKey="amount" fill="#10b981" name="Montant (F)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble de vos statistiques</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {renderOverviewCards()}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderCharts()}
      </div>
    </div>
  );
};

// Composant de carte statistique
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
