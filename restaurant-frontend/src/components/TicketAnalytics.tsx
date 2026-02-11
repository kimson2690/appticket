import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Ticket, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, Clock, Users
} from 'lucide-react';
import {
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const formatAmount = (amount: number) => {
  return Math.round(amount).toLocaleString('fr-FR') + ' F';
};

const TicketAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getTicketAnalytics();
      setData(result);
    } catch (err: any) {
      console.error('Erreur chargement analytics:', err);
      setError('Erreur lors du chargement des analyses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur</h3>
        <p className="text-gray-500">{error || 'Données non disponibles'}</p>
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
          Réessayer
        </button>
      </div>
    );
  }

  const { summary, distribution, monthly_data, by_employee, soon_expiring } = data;

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analyses des Tickets</h2>
        <p className="text-gray-500">Vue d'ensemble de l'utilisation et de l'expiration des tickets</p>
      </div>

      {/* Cartes résumé */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total affectés */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Affectés</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total_assigned}</p>
              <p className="text-sm text-gray-400">{formatAmount(summary.total_assigned_amount)}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Ticket className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Utilisés */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Utilisés</p>
              <p className="text-2xl font-bold text-green-600">{summary.total_used}</p>
              <p className="text-sm text-gray-400">{formatAmount(summary.total_used_amount)}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600 font-medium">{summary.usage_rate}%</span>
            <span className="text-gray-400 ml-1">taux d'utilisation</span>
          </div>
        </div>

        {/* Disponibles (valides) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Disponibles (valides)</p>
              <p className="text-2xl font-bold text-blue-600">{summary.valid_remaining}</p>
              <p className="text-sm text-gray-400">{formatAmount(summary.valid_remaining_amount)}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            {summary.valid_batches} souche(s) active(s)
          </div>
        </div>

        {/* Expirés */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Expirés (perdus)</p>
              <p className="text-2xl font-bold text-red-600">{summary.expired_remaining}</p>
              <p className="text-sm text-gray-400">{formatAmount(summary.expired_remaining_amount)}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-600 font-medium">{summary.expiry_rate}%</span>
            <span className="text-gray-400 ml-1">taux de perte</span>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des tickets (Pie) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-md">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Répartition des Tickets</h3>
              <p className="text-sm text-gray-500">{summary.total_assigned} tickets au total</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={distribution.filter((d: any) => d.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
              >
                {distribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#fff" />
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
                  `${value} tickets (${formatAmount(value * summary.ticket_value)})`,
                  name
                ]}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
              />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Évolution mensuelle */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Évolution Mensuelle</h3>
              <p className="text-sm text-gray-500">Affectés, utilisés et expirés par mois</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly_data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
              <Bar dataKey="assigned" fill="#3b82f6" name="Tickets affectés" radius={[4, 4, 0, 0]} />
              <Bar dataKey="used_amount" fill="#10b981" name="Dépensé (F)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expired" fill="#ef4444" name="Tickets expirés" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertes : souches bientôt expirées */}
      {soon_expiring && soon_expiring.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <h3 className="text-lg font-bold text-amber-800">Souches bientôt expirées</h3>
            <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
              {soon_expiring.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-amber-200">
                  <th className="text-left text-xs font-medium text-amber-700 uppercase py-2 px-3">Souche</th>
                  <th className="text-left text-xs font-medium text-amber-700 uppercase py-2 px-3">Employé</th>
                  <th className="text-left text-xs font-medium text-amber-700 uppercase py-2 px-3">Tickets restants</th>
                  <th className="text-left text-xs font-medium text-amber-700 uppercase py-2 px-3">Montant</th>
                  <th className="text-left text-xs font-medium text-amber-700 uppercase py-2 px-3">Expire le</th>
                  <th className="text-left text-xs font-medium text-amber-700 uppercase py-2 px-3">Jours restants</th>
                </tr>
              </thead>
              <tbody>
                {soon_expiring.map((batch: any, index: number) => (
                  <tr key={index} className="border-b border-amber-100">
                    <td className="py-2 px-3 text-sm text-amber-900 font-mono">{batch.batch_number}</td>
                    <td className="py-2 px-3 text-sm text-amber-900">{batch.employee_name}</td>
                    <td className="py-2 px-3 text-sm font-medium text-amber-900">{batch.remaining_tickets}</td>
                    <td className="py-2 px-3 text-sm text-amber-900">{formatAmount(batch.remaining_amount)}</td>
                    <td className="py-2 px-3 text-sm text-amber-900">{batch.validity_end}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        batch.days_left <= 2 ? 'bg-red-100 text-red-700' : 'bg-amber-200 text-amber-800'
                      }`}>
                        {batch.days_left}j
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau par employé */}
      {by_employee && by_employee.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Détail par Employé</h3>
              <p className="text-sm text-gray-500">Soldes valides, utilisés et expirés</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-green-600 uppercase">Utilisés</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-blue-600 uppercase">Disponibles</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-red-600 uppercase">Expirés</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-purple-600 uppercase">Cumul Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {by_employee.map((emp: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="text-green-600 font-medium">{emp.used}</span>
                      <span className="text-gray-400 text-xs ml-1">({formatAmount(emp.used_amount)})</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="text-blue-600 font-medium">{emp.valid_remaining}</span>
                      <span className="text-gray-400 text-xs ml-1">({formatAmount(emp.valid_remaining_amount)})</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {emp.expired_remaining > 0 ? (
                        <>
                          <span className="text-red-600 font-medium">{emp.expired_remaining}</span>
                          <span className="text-gray-400 text-xs ml-1">({formatAmount(emp.expired_amount)})</span>
                        </>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatAmount(emp.total_received)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketAnalytics;
