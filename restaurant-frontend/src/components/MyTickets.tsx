import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Clock, CheckCircle, XCircle, Package } from 'lucide-react';

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

const MyTickets: React.FC = () => {
  const [balance, setBalance] = useState<TicketBalance | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = 'http://localhost:8001/api';

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': userId || '',
        'X-User-Name': userName || '',
      };

      const balanceRes = await fetch(`${baseUrl}/employee/ticket-balance`, { headers });
      const balanceData = await balanceRes.json();

      if (balanceData.success) setBalance(balanceData.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + 'F';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Tickets</h1>
          <p className="text-gray-600 mt-1">Consultez votre solde et vos statistiques de tickets</p>
        </div>
      </div>

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

      {/* Vue détaillée */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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
    </div>
  );
};

export default MyTickets;
