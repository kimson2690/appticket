import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Clock, CheckCircle, XCircle, Package, History, User, LogOut } from 'lucide-react';

interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_id: string;
  department: string;
  position: string;
  ticket_balance: number;
  status: string;
  hire_date: string;
}

interface TicketBalance {
  employee_name: string;
  ticket_balance: number;
  tickets_count: {
    total: number;
    available: number;
    used: number;
    expired: number;
  };
  batches_count: number;
}

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

const EmployeeDashboard: React.FC = () => {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [balance, setBalance] = useState<TicketBalance | null>(null);
  const [history, setHistory] = useState<TicketAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balance' | 'history'>('balance');

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

      const [profileRes, balanceRes, historyRes] = await Promise.all([
        fetch(`${baseUrl}/employee/profile`, { headers }),
        fetch(`${baseUrl}/employee/ticket-balance`, { headers }),
        fetch(`${baseUrl}/employee/ticket-history`, { headers })
      ]);

      const profileData = await profileRes.json();
      const balanceData = await balanceRes.json();
      const historyData = await historyRes.json();

      if (profileData.success) setProfile(profileData.data);
      if (balanceData.success) setBalance(balanceData.data);
      if (historyData.success) setHistory(historyData.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + 'F';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {profile?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bonjour, {profile?.name} 👋</h1>
                <p className="text-sm text-gray-600">{profile?.position} • {profile?.department}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Carte principale - Solde de tickets */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-orange-100 text-sm font-medium">Solde Disponible</p>
                <h2 className="text-4xl font-bold">{formatCurrency(balance?.ticket_balance || 0)}</h2>
              </div>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-200 opacity-50" />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-orange-100 text-xs mb-1">Total Tickets</p>
              <p className="text-2xl font-bold">{balance?.tickets_count.total || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-orange-100 text-xs mb-1">Disponibles</p>
              <p className="text-2xl font-bold text-green-300">{balance?.tickets_count.available || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-orange-100 text-xs mb-1">Utilisés</p>
              <p className="text-2xl font-bold text-blue-300">{balance?.tickets_count.used || 0}</p>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Tickets expirés */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets Expirés</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{balance?.tickets_count.expired || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Souches actives */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Souches Actives</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{balance?.batches_count || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Taux d'utilisation */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux d'Utilisation</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {balance && balance.tickets_count.total > 0
                    ? Math.round((balance.tickets_count.used / balance.tickets_count.total) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('balance')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'balance'
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Mes Tickets</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <History className="w-5 h-5" />
                  <span>Historique ({history.length})</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'balance' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Vue d'ensemble de vos tickets</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Tickets disponibles</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{balance?.tickets_count.available || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <XCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Tickets utilisés</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{balance?.tickets_count.used || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-gray-700">Tickets expirés</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{balance?.tickets_count.expired || 0}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Historique des affectations</h3>
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun historique disponible</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((assignment) => (
                      <div key={assignment.id} className="border border-gray-200 rounded-xl p-4 hover:border-orange-200 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              assignment.type === 'batch' ? 'bg-purple-100' : 'bg-blue-100'
                            }`}>
                              <Package className={`w-5 h-5 ${
                                assignment.type === 'batch' ? 'text-purple-600' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                +{assignment.tickets_count} ticket{assignment.tickets_count > 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-gray-500">{assignment.type === 'batch' ? 'Affectation groupée' : 'Affectation manuelle'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-orange-600">{formatCurrency(assignment.ticket_value * assignment.tickets_count)}</p>
                            <p className="text-xs text-gray-500">{formatDate(assignment.created_at)}</p>
                          </div>
                        </div>
                        {assignment.batch_number && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Souche:</span> {assignment.batch_number}
                            </p>
                          </div>
                        )}
                        {assignment.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Note:</span> {assignment.notes}
                            </p>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500">Affecté par: {assignment.assigned_by}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
