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
          <StatCard
            title="Tickets Émis"
            value={formatNumber(overview.total_tickets_issued || 0)}
            icon={<Ticket className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Valeur Tickets"
            value={formatCurrency(overview.total_tickets_value || 0)}
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
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
            <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-xl shadow-lg p-6 border border-orange-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-md">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Commandes par Mois</h3>
                  <p className="text-sm text-gray-500">Évolution sur 6 mois</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.orders_by_month}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#ea580c" stopOpacity={0.9}/>
                    </linearGradient>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#d1d5db" />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#d1d5db" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  <Bar dataKey="orders" fill="url(#colorOrders)" name="Commandes" radius={[8, 8, 0, 0]} maxBarSize={50} />
                  <Bar dataKey="amount" fill="url(#colorAmount)" name="Montant (F)" radius={[8, 8, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top restaurants */}
          {stats.top_restaurants && stats.top_restaurants.length > 0 && (
            <div className="bg-gradient-to-br from-white to-green-50/30 rounded-xl shadow-lg p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Top 5 Restaurants</h3>
                  <p className="text-sm text-gray-500">Par chiffre d'affaires</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.top_restaurants} layout="vertical" margin={{ left: 20 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#d1d5db" />
                  <YAxis dataKey="restaurant_name" type="category" width={150} tick={{ fill: '#6b7280', fontSize: 12 }} stroke="#d1d5db" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                  />
                  <Bar dataKey="revenue" fill="url(#colorRevenue)" name="Revenue (F)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Utilisateurs par rôle - PieChart */}
          {stats.users_by_role && Object.keys(stats.users_by_role).length > 0 && (
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-xl shadow-lg p-6 border border-purple-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Répartition par Rôle</h3>
                  <p className="text-sm text-gray-500">{Object.keys(stats.users_by_role).length} rôle(s) actif(s)</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <RechartsPie>
                  <Pie
                    data={Object.entries(stats.users_by_role).map(([role, count]) => ({
                      name: role,
                      value: count
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={110}
                    innerRadius={70}
                    label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={{
                      stroke: '#9ca3af',
                      strokeWidth: 1
                    }}
                  >
                    {Object.keys(stats.users_by_role).map((_entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        stroke="#fff"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: any, name: string) => [
                      formatNumber(value),
                      name
                    ]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={60}
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '13px'
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tickets affectés par mois et par entreprise */}
          {stats.tickets_by_month_company && stats.tickets_by_month_company.length > 0 && (
            <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-xl shadow-lg p-6 border border-blue-100 col-span-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Tickets Affectés par Mois</h3>
                  <p className="text-sm text-gray-500">Évolution par entreprise</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart 
                  data={stats.tickets_by_month_company}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <defs>
                    {COLORS.map((color, index) => (
                      <linearGradient key={`gradient-${index}`} id={`lineGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={color} stopOpacity={0.3}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#d1d5db"
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#d1d5db"
                    label={{ value: 'Tickets', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="line"
                  />
                  {Object.keys(stats.tickets_by_month_company[0] || {})
                    .filter(key => key !== 'month')
                    .map((companyName, index) => (
                      <Line
                        key={companyName}
                        type="monotone"
                        dataKey={companyName}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={3}
                        dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 7 }}
                        name={companyName}
                      />
                    ))
                  }
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Commandes par entreprise */}
          {stats.orders_by_company && stats.orders_by_company.length > 0 && (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-md">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Commandes par Entreprise</h3>
                    <p className="text-sm text-gray-500">{stats.orders_by_company.length} entreprise(s)</p>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart 
                  data={stats.orders_by_company}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <defs>
                    <linearGradient id="colorCommandes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.9}/>
                    </linearGradient>
                    <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="company_name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                    stroke="#d1d5db"
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#d1d5db"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    labelStyle={{ 
                      color: '#111827', 
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}
                    formatter={(value: any) => [
                      typeof value === 'number' ? formatNumber(value) : value,
                      ''
                    ]}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="url(#colorCommandes)" 
                    name="Commandes"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="url(#colorMontant)" 
                    name="Montant (F)"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={60}
                  />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {renderOverviewCards()}
      </div>

      {/* Graphiques */}
      <div className={`grid gap-6 ${userRole === 'Administrateur' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
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
