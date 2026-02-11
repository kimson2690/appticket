import React, { useState, useEffect } from 'react';
import { getDashboardStats, type DashboardStatsData } from '../services/api';
import { 
  Users, Building2, Store, ShoppingCart, TrendingUp, 
  DollarSign, Package, BarChart3, Activity,
  Ticket, ArrowUpRight, ArrowDownRight, CalendarDays, MoreHorizontal
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'];

const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.96)',
  border: 'none',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  padding: '10px 14px',
  fontSize: '13px',
};

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRole = localStorage.getItem('userRole') || '';

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const fmtK = (n: number) => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'K' : fmt(n);
  const fmtCur = (a: number) => fmt(a) + ' F';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-center">
        <p className="font-semibold text-lg mb-1">Erreur</p>
        <p className="text-sm">{error || 'Impossible de charger les statistiques'}</p>
        <button onClick={loadStats} className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-xl text-sm font-medium transition-colors">Réessayer</button>
      </div>
    );
  }

  const ov = stats.overview;
  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // ─── ADMIN ───
  if (userRole === 'Administrateur') {
    const adminCards = [
      { title: 'Utilisateurs', value: fmtK(ov.total_users || 0), icon: Users, color: 'bg-blue-50 text-blue-600', trend: 12.5, sub: 'Total actifs' },
      { title: 'Entreprises', value: fmt(ov.total_companies || 0), icon: Building2, color: 'bg-emerald-50 text-emerald-600', trend: 8.4, sub: 'Enregistrées' },
      { title: 'Restaurants', value: fmt(ov.total_restaurants || 0), icon: Store, color: 'bg-purple-50 text-purple-600', trend: -2.1, sub: 'Partenaires' },
      { title: 'Commandes', value: fmtK(ov.total_orders || 0), icon: ShoppingCart, color: 'bg-orange-50 text-orange-600', trend: 15.5, sub: 'Confirmées' },
    ];

    return (
      <div className="space-y-6">
        <DashHeader title="Tableau de Bord" date={dateStr} />

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {adminCards.map((c, i) => <KpiCard key={i} {...c} />)}
        </div>

        {/* Row 2: Main chart + side widget */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders by month – large area chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Valeur Totale des Tickets</h3>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{fmtCur(ov.total_tickets_value || 0)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmt(ov.total_tickets_issued || 0)} tickets émis</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><MoreHorizontal className="w-5 h-5 text-gray-400" /></button>
            </div>
            {stats.orders_by_month && (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stats.orders_by_month} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaOrange" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2.5} fill="url(#areaOrange)" name="Montant (F)" />
                  <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={false} name="Commandes" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Users by role – donut */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Répartition Utilisateurs</h3>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><MoreHorizontal className="w-5 h-5 text-gray-400" /></button>
            </div>
            {stats.users_by_role && (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsPie>
                    <Pie
                      data={Object.entries(stats.users_by_role).map(([role, count]) => ({ name: role, value: count }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={55} strokeWidth={3} stroke="#fff"
                    >
                      {Object.keys(stats.users_by_role).map((_e: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: string) => [fmt(v), n]} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {Object.entries(stats.users_by_role).map(([role, count], i) => (
                    <div key={role} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                        <span className="text-gray-600">{role}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{fmt(count as number)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Row 3: Top restaurants + Orders by company */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top restaurants table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Top Restaurants</h3>
              <span className="text-xs text-gray-400">Par chiffre d'affaires</span>
            </div>
            {stats.top_restaurants && stats.top_restaurants.length > 0 ? (
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wider">
                      <th className="text-left pb-3 font-medium">#</th>
                      <th className="text-left pb-3 font-medium">Restaurant</th>
                      <th className="text-right pb-3 font-medium">Commandes</th>
                      <th className="text-right pb-3 font-medium">Revenue</th>
                      <th className="text-right pb-3 font-medium">Part</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.top_restaurants.map((r: any, i: number) => {
                      const totalRev = stats.top_restaurants.reduce((s: number, x: any) => s + (x.revenue || 0), 0);
                      const pct = totalRev > 0 ? ((r.revenue / totalRev) * 100).toFixed(1) : '0';
                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 pr-3">
                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-orange-50 text-orange-600 text-xs font-bold">
                              {i + 1}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                                <Store className="w-4 h-4 text-orange-500" />
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{r.restaurant_name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right text-sm text-gray-600 font-medium">{fmt(r.orders || 0)}</td>
                          <td className="py-3 text-right">
                            <span className="text-sm font-semibold text-emerald-600">{fmtCur(r.revenue || 0)}</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Aucune donnée disponible</p>
            )}
          </div>

          {/* Orders by company bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Commandes / Entreprise</h3>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><MoreHorizontal className="w-5 h-5 text-gray-400" /></button>
            </div>
            {stats.orders_by_company && stats.orders_by_company.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.orders_by_company} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="company_name" type="category" width={100} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="orders" fill="#f97316" name="Commandes" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>
            )}
          </div>
        </div>

        {/* Row 4: Tickets by month full width */}
        {stats.tickets_by_month_company && stats.tickets_by_month_company.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Tickets Affectés par Mois</h3>
                <p className="text-sm text-gray-400">Évolution par entreprise</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><MoreHorizontal className="w-5 h-5 text-gray-400" /></button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.tickets_by_month_company} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '13px' }} />
                {(Array.from(new Set(stats.tickets_by_month_company.flatMap((r: any) => Object.keys(r).filter(k => k !== 'month')))) as string[]).map((name: string, i: number) => (
                  <Line key={name} type="monotone" dataKey={name} stroke={COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  }

  // ─── GESTIONNAIRE ENTREPRISE ───
  if (userRole === 'Gestionnaire Entreprise') {
    const compCards = [
      { title: 'Employés', value: fmt(ov.total_employees || 0), icon: Users, color: 'bg-blue-50 text-blue-600', trend: 5.2, sub: 'Actifs' },
      { title: 'Total Dépensé', value: fmtCur(ov.total_spent || 0), icon: DollarSign, color: 'bg-orange-50 text-orange-600', trend: 12.8, sub: 'Ce mois' },
      { title: 'Commandes', value: fmt(ov.total_orders || 0), icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600', trend: 8.1, sub: 'Confirmées' },
      { title: "Taux d'Utilisation", value: `${ov.tickets_usage_rate || 0}%`, icon: TrendingUp, color: 'bg-purple-50 text-purple-600', trend: 3.4, sub: 'Des tickets' },
    ];
    return (
      <div className="space-y-6">
        <DashHeader title="Tableau de Bord" date={dateStr} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {compCards.map((c, i) => <KpiCard key={i} {...c} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Évolution des Dépenses</h3>
            <p className="text-3xl font-extrabold text-gray-900">{fmtCur(ov.total_spent || 0)}</p>
            {stats.monthly_expenses && (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stats.monthly_expenses} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaOrange2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2.5} fill="url(#areaOrange2)" name="Montant (F)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Dépenses par Restaurant</h3>
            {stats.expenses_by_restaurant && stats.expenses_by_restaurant.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsPie>
                    <Pie data={stats.expenses_by_restaurant} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={55} strokeWidth={3} stroke="#fff">
                      {stats.expenses_by_restaurant.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [fmtCur(v), 'Montant']} />
                  </RechartsPie>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {stats.expenses_by_restaurant.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                        <span className="text-gray-600">{r.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{fmtCur(r.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>}
          </div>
        </div>
      </div>
    );
  }

  // ─── GESTIONNAIRE RESTAURANT ───
  if (userRole === 'Gestionnaire Restaurant') {
    const restoCards = [
      { title: 'Commandes', value: fmt(ov.total_orders || 0), icon: ShoppingCart, color: 'bg-blue-50 text-blue-600', trend: 10.5, sub: 'Confirmées' },
      { title: "Chiffre d'Affaires", value: fmtCur(ov.total_revenue || 0), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', trend: 15.2, sub: 'Total' },
      { title: 'Panier Moyen', value: fmtCur(ov.average_order_value || 0), icon: TrendingUp, color: 'bg-purple-50 text-purple-600', trend: 4.4, sub: 'Par commande' },
      { title: 'Plats Vendus', value: fmt(stats.top_dishes?.reduce((s: number, d: any) => s + (d.quantity || 0), 0) || 0), icon: Package, color: 'bg-orange-50 text-orange-600', trend: 7.8, sub: 'Total' },
    ];
    return (
      <div className="space-y-6">
        <DashHeader title="Tableau de Bord" date={dateStr} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{restoCards.map((c, i) => <KpiCard key={i} {...c} />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Revenus Mensuels</h3>
            <p className="text-3xl font-extrabold text-gray-900">{fmtCur(ov.total_revenue || 0)}</p>
            {stats.orders_by_month && (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.orders_by_month} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="orders" fill="#3b82f6" name="Commandes" radius={[6, 6, 0, 0]} barSize={24} />
                  <Bar dataKey="amount" fill="#f97316" name="Montant (F)" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Plats</h3>
            {stats.top_dishes && stats.top_dishes.length > 0 ? (
              <div className="space-y-3">
                {stats.top_dishes.slice(0, 8).map((d: any, i: number) => {
                  const maxQ = Math.max(...stats.top_dishes.map((x: any) => x.quantity || 0));
                  const pct = maxQ > 0 ? (d.quantity / maxQ) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium truncate mr-2">{d.name}</span>
                        <span className="text-gray-500 font-semibold flex-shrink-0">{d.quantity}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-gray-400 text-sm text-center py-8">Aucune donnée</p>}
          </div>
        </div>
      </div>
    );
  }

  // ─── EMPLOYÉ ───
  const empCards = [
    { title: 'Mes Commandes', value: fmt(ov.total_orders || 0), icon: ShoppingCart, color: 'bg-blue-50 text-blue-600', trend: 5, sub: 'Total' },
    { title: 'Total Dépensé', value: fmtCur(ov.total_spent || 0), icon: DollarSign, color: 'bg-orange-50 text-orange-600', trend: 8.3, sub: 'En tickets' },
    { title: 'Tickets Reçus', value: fmt(ov.tickets_assigned || 0), icon: Ticket, color: 'bg-emerald-50 text-emerald-600', trend: 12, sub: 'Affectés' },
    { title: 'Restaurants', value: fmt(stats.favorite_restaurants?.length || 0), icon: Store, color: 'bg-purple-50 text-purple-600', trend: 0, sub: 'Visités' },
  ];
  return (
    <div className="space-y-6">
      <DashHeader title="Mon Tableau de Bord" date={dateStr} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{empCards.map((c, i) => <KpiCard key={i} {...c} />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Mon Utilisation</h3>
          <p className="text-3xl font-extrabold text-gray-900">{fmtCur(ov.total_spent || 0)}</p>
          {stats.monthly_usage && (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.monthly_usage} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaEmp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2.5} fill="url(#areaEmp)" name="Montant (F)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Mes Restaurants</h3>
          {stats.favorite_restaurants && stats.favorite_restaurants.length > 0 ? (
            <div className="space-y-3">
              {stats.favorite_restaurants.map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-orange-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.orders} commande{r.orders > 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-bold text-orange-600">{fmtCur(r.amount)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-8">Aucune commande</p>}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ───

const DashHeader: React.FC<{ title: string; date: string }> = ({ title, date }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-400 mt-0.5">Vue d'ensemble de votre activité</p>
    </div>
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
      <CalendarDays className="w-4 h-4 text-gray-400" />
      <span className="text-sm text-gray-600 font-medium">{date}</span>
    </div>
  </div>
);

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.FC<any>;
  color: string;
  trend: number;
  sub: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, color, trend, sub }) => {
  const up = trend >= 0;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight">{value}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
            <span className="text-xs text-gray-400">{sub}</span>
          </div>
        </div>
        <div className={`p-2.5 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
