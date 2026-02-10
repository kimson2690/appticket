import React, { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Package, ArrowUpRight, Sparkles, Activity, AlertCircle, X, Calendar, Eye, ChevronRight, Ticket } from 'lucide-react';

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

interface BatchDetail {
  id: string;
  batch_number: string;
  total_tickets: number;
  ticket_value: string;
  validity_start: string;
  validity_end: string;
  assigned_tickets: number;
  used_tickets: number;
  remaining_tickets: number;
  status: string;
  employee_name: string;
  created_at: string;
}

const MyTickets: React.FC = () => {
  const [balance, setBalance] = useState<TicketBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<BatchDetail[]>([]);
  const [modalType, setModalType] = useState<'expired' | 'valid' | null>(null);

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

      const batchesRes = await fetch(`${baseUrl}/employee/my-batches`, { headers });
      const batchesData = await batchesRes.json();
      if (batchesData.success) setBatches(batchesData.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const expiredBatches = batches.filter(b => b.status === 'expired');
  const validBatches = batches.filter(b => b.status === 'active');

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
    <div className="max-w-7xl mx-auto">
      {/* Header avec nom d'utilisateur */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium text-orange-600">Bonjour, {balance?.employee_name || 'Utilisateur'}</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Mes Tickets Restaurant</h1>
        <p className="text-gray-600 text-lg">Suivez votre solde et gérez vos tickets en temps réel</p>
      </div>

      {/* Carte principale - Solde avec glassmorphism */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 rounded-3xl p-8 md:p-10 text-white mb-8 shadow-2xl overflow-hidden group hover:shadow-orange-200/50 transition-all duration-300">
        {/* Décoration arrière-plan */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center ring-4 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-9 h-9 text-white" />
                </div>
                <div>
                  <p className="text-orange-100 text-sm font-medium mb-1">💰 Solde Disponible</p>
                  <h2 className="text-5xl font-bold tracking-tight">{formatCurrency(balance?.ticket_balance || 0)}</h2>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-orange-100 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>Prêt à être utilisé</span>
              </div>
            </div>
            <div className="hidden md:block">
              <Activity className="w-20 h-20 text-orange-200/30" />
            </div>
          </div>

          {/* Statistiques en grille améliorée */}
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors duration-200">
              <p className="text-orange-100 text-xs font-medium mb-2">📋 Total Tickets</p>
              <p className="text-3xl font-bold mb-1">{balance?.tickets_count.total || 0}</p>
              <div className="h-1 w-full bg-white/20 rounded-full mt-2">
                <div className="h-full bg-white rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors duration-200">
              <p className="text-orange-100 text-xs font-medium mb-2">✅ Disponibles</p>
              <p className="text-3xl font-bold text-green-300 mb-1">{balance?.tickets_count.available || 0}</p>
              <div className="h-1 w-full bg-white/20 rounded-full mt-2">
                <div className="h-full bg-green-300 rounded-full" style={{width: balance && balance.tickets_count.total > 0 ? `${(balance.tickets_count.available / balance.tickets_count.total) * 100}%` : '0%'}}></div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-colors duration-200">
              <p className="text-orange-100 text-xs font-medium mb-2">🔄 Utilisés</p>
              <p className="text-3xl font-bold text-blue-300 mb-1">{balance?.tickets_count.used || 0}</p>
              <div className="h-1 w-full bg-white/20 rounded-full mt-2">
                <div className="h-full bg-blue-300 rounded-full" style={{width: balance && balance.tickets_count.total > 0 ? `${(balance.tickets_count.used / balance.tickets_count.total) * 100}%` : '0%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides avec indicateurs circulaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Tickets expirés */}
        <div onClick={() => setModalType('expired')} className="cursor-pointer group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-red-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-red-600" />
                <p className="text-sm font-semibold text-gray-600">Tickets Expirés</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{balance?.tickets_count.expired || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Non utilisables</p>
            </div>
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="#fee2e2" strokeWidth="6" />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  fill="none" 
                  stroke="#dc2626" 
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - (balance && balance.tickets_count.total > 0 ? balance.tickets_count.expired / balance.tickets_count.total : 0))}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-red-600">
                  {balance && balance.tickets_count.total > 0 ? Math.round((balance.tickets_count.expired / balance.tickets_count.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center text-xs text-red-500 font-medium group-hover:text-red-700 transition-colors">
            <Eye className="w-3.5 h-3.5 mr-1" />
            Voir les détails
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </div>
        </div>

        {/* Souches actives */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-gray-600">Souches Actives</p>
              </div>
              <p className="text-4xl font-bold text-gray-900">{balance?.batches_count || 0}</p>
              <p className="text-xs text-gray-500 mt-1">En cours</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Taux d'utilisation avec barre de progression */}
        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all duration-300">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-gray-600">Taux d'Utilisation</p>
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {balance && balance.tickets_count.total > 0
                ? Math.round((balance.tickets_count.used / balance.tickets_count.total) * 100)
                : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {balance?.tickets_count.used || 0} sur {balance?.tickets_count.total || 0} utilisés
            </p>
          </div>
          {/* Barre de progression moderne */}
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out"
              style={{
                width: balance && balance.tickets_count.total > 0 
                  ? `${(balance.tickets_count.used / balance.tickets_count.total) * 100}%` 
                  : '0%'
              }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Vue détaillée améliorée avec conseils */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails des tickets */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">📊 Répartition Détaillée</h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {balance?.tickets_count.total || 0} tickets au total
            </span>
          </div>
          <div className="space-y-3">
            <div onClick={() => setModalType('valid')} className="cursor-pointer group flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-transparent rounded-xl border border-green-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700 block">Tickets disponibles</span>
                  <span className="text-xs text-gray-500">Prêts à utiliser</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-600">{balance?.tickets_count.available || 0}</span>
                  <p className="text-xs text-gray-500">
                    {balance && balance.tickets_count.total > 0 ? Math.round((balance.tickets_count.available / balance.tickets_count.total) * 100) : 0}% du total
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-green-400 group-hover:text-green-600 transition-colors" />
              </div>
            </div>
            <div className="group flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <XCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700 block">Tickets utilisés</span>
                  <span className="text-xs text-gray-500">Déjà consommés</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-600">{balance?.tickets_count.used || 0}</span>
                <p className="text-xs text-gray-500">
                  {balance && balance.tickets_count.total > 0 ? Math.round((balance.tickets_count.used / balance.tickets_count.total) * 100) : 0}% du total
                </p>
              </div>
            </div>
            <div onClick={() => setModalType('expired')} className="cursor-pointer group flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-transparent rounded-xl border border-red-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-gray-700 block">Tickets expirés</span>
                  <span className="text-xs text-gray-500">Périmés</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-2xl font-bold text-red-600">{balance?.tickets_count.expired || 0}</span>
                  <p className="text-xs text-gray-500">
                    {balance && balance.tickets_count.total > 0 ? Math.round((balance.tickets_count.expired / balance.tickets_count.total) * 100) : 0}% du total
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Conseils et astuces */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">💡 Conseils</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50">
              <p className="text-sm font-medium text-gray-800 mb-1">✨ Utilisez vos tickets</p>
              <p className="text-xs text-gray-600">N'oubliez pas d'utiliser vos tickets avant leur expiration pour ne rien perdre.</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50">
              <p className="text-sm font-medium text-gray-800 mb-1">📅 Vérifiez les dates</p>
              <p className="text-xs text-gray-600">Consultez régulièrement vos souches pour connaître les dates d'expiration.</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50">
              <p className="text-sm font-medium text-gray-800 mb-1">🍽️ Commandez facilement</p>
              <p className="text-xs text-gray-600">Utilisez la section "Commander" pour utiliser vos tickets en ligne.</p>
            </div>
          </div>
        </div>
      </div>
      {/* Modal Détails */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalType(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header Modal */}
            <div className={`p-6 ${modalType === 'expired' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {modalType === 'expired' ? (
                    <Clock className="w-7 h-7" />
                  ) : (
                    <CheckCircle className="w-7 h-7" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold">
                      {modalType === 'expired' ? 'Tickets Expirés' : 'Tickets Valides'}
                    </h2>
                    <p className="text-sm opacity-90">
                      {modalType === 'expired'
                        ? `${expiredBatches.length} souche(s) expirée(s)`
                        : `${validBatches.length} souche(s) active(s)`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalType(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {(modalType === 'expired' ? expiredBatches : validBatches).length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className={`w-16 h-16 mx-auto mb-4 ${modalType === 'expired' ? 'text-red-200' : 'text-green-200'}`} />
                  <p className="text-gray-500 text-lg font-medium">
                    {modalType === 'expired' ? 'Aucun ticket expiré' : 'Aucun ticket valide'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(modalType === 'expired' ? expiredBatches : validBatches).map((batch) => (
                    <div key={batch.id} className={`rounded-xl border-2 p-5 transition-all hover:shadow-md ${
                      modalType === 'expired'
                        ? 'border-red-100 bg-red-50/50'
                        : 'border-green-100 bg-green-50/50'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Package className={`w-4 h-4 ${modalType === 'expired' ? 'text-red-500' : 'text-green-500'}`} />
                            <span className="font-bold text-gray-900">Souche {batch.batch_number}</span>
                          </div>
                          <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                            modalType === 'expired'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {modalType === 'expired' ? 'Expirée' : 'Active'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${modalType === 'expired' ? 'text-red-600' : 'text-green-600'}`}>
                            {batch.remaining_tickets}
                          </p>
                          <p className="text-xs text-gray-500">tickets restants</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Valeur unitaire</p>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(batch.ticket_value))}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Total tickets</p>
                          <p className="text-sm font-bold text-gray-900">{batch.total_tickets}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Utilisés</p>
                          <p className="text-sm font-bold text-blue-600">{batch.used_tickets}</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Valeur restante</p>
                          <p className={`text-sm font-bold ${modalType === 'expired' ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(batch.remaining_tickets * Number(batch.ticket_value))}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Du {formatDate(batch.validity_start)}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Au {formatDate(batch.validity_end)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Résumé en bas du modal */}
                  <div className={`rounded-xl p-4 mt-2 ${
                    modalType === 'expired' ? 'bg-red-100 border border-red-200' : 'bg-green-100 border border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${modalType === 'expired' ? 'text-red-800' : 'text-green-800'}`}>
                        Total {modalType === 'expired' ? 'perdu' : 'disponible'}
                      </span>
                      <span className={`text-lg font-bold ${modalType === 'expired' ? 'text-red-700' : 'text-green-700'}`}>
                        {formatCurrency(
                          (modalType === 'expired' ? expiredBatches : validBatches)
                            .reduce((sum, b) => sum + b.remaining_tickets * Number(b.ticket_value), 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
