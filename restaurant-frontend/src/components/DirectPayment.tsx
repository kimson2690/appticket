import React, { useState, useEffect } from 'react';
import {
  CreditCard, Store, Wallet, CheckCircle, AlertCircle, Search,
  Receipt, Clock, X, Send, ChevronDown, ChevronUp
} from 'lucide-react';
import { apiService } from '../services/api';

interface RestaurantOption {
  id: string;
  name: string;
  address?: string;
  cuisine_type?: string;
  average_rating?: number;
}

interface PaymentRecord {
  id: string;
  reference: string;
  restaurant_name: string;
  amount: number;
  status: string;
  notes?: string;
  created_at: string;
}

const DirectPayment: React.FC = () => {
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantOption | null>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [ticketBalance, setTicketBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const companyId = localStorage.getItem('userCompanyId');

      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': userId || '',
        'X-User-Name': userName || '',
        'X-User-Company-Id': companyId || '',
      };

      // Charger les restaurants partenaires
      const restaurantsRes = await fetch(`${baseUrl}/employee/restaurants`, { headers });
      const restaurantsData = await restaurantsRes.json();
      if (restaurantsData.success) {
        setRestaurants(restaurantsData.data.filter((r: any) =>
          r.status === 'active' || r.is_active === true
        ));
      }

      // Charger le solde de tickets
      const balanceRes = await fetch(`${baseUrl}/employee/ticket-balance`, { headers });
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setTicketBalance(balanceData.data.ticket_balance);
      }

      // Charger l'historique des paiements
      const payments = await apiService.getDirectPaymentHistory();
      setHistory(payments);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(val) + 'F';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async () => {
    if (!selectedRestaurant || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification('error', 'Veuillez entrer un montant valide');
      return;
    }
    if (amountNum > ticketBalance) {
      showNotification('error', `Solde insuffisant. Disponible: ${formatCurrency(ticketBalance)}`);
      return;
    }

    setShowConfirm(true);
  };

  const confirmPayment = async () => {
    if (!selectedRestaurant || !amount) return;

    setSubmitting(true);
    setShowConfirm(false);

    try {
      const result = await apiService.submitDirectPayment({
        restaurant_id: selectedRestaurant.id,
        amount: parseFloat(amount),
        notes: notes || undefined,
      });

      if (result.success) {
        showNotification('success', result.message || 'Paiement effectué avec succès !');
        setSelectedRestaurant(null);
        setAmount('');
        setNotes('');
        loadData();
      } else {
        showNotification('error', result.message || 'Erreur lors du paiement');
      }
    } catch (error: any) {
      showNotification('error', error?.message || 'Erreur lors du paiement');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRestaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-[slideDown_0.3s_ease-out] ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium flex-1">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/50 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header + Solde */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paiement Tickets</h1>
        <p className="text-gray-500">Payez directement un restaurant avec vos tickets repas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-semibold text-orange-700">Mon solde</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(ticketBalance)}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-semibold text-gray-600">Restaurants</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{restaurants.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-semibold text-gray-600">Paiements</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{history.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de paiement */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="relative overflow-hidden px-6 pt-6 pb-5">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative flex items-center gap-3.5">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Nouveau paiement</h2>
                <p className="text-xs text-gray-500 mt-0.5">Sélectionnez un restaurant et le montant</p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-5 space-y-5">
            {/* Sélection du restaurant */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                <Store className="w-3.5 h-3.5 text-orange-500" />
                Restaurant <span className="text-red-400">*</span>
              </label>

              {selectedRestaurant ? (
                <div className="flex items-center justify-between p-3.5 bg-orange-50 border-2 border-orange-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Store className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedRestaurant.name}</p>
                      {selectedRestaurant.cuisine_type && (
                        <p className="text-xs text-gray-500">{selectedRestaurant.cuisine_type}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedRestaurant(null)}
                    className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-400 hover:text-orange-600 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un restaurant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border-2 border-gray-100 p-2">
                    {filteredRestaurants.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-4">Aucun restaurant trouvé</p>
                    ) : (
                      filteredRestaurants.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => { setSelectedRestaurant(r); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors text-left"
                        >
                          <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Store className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                            {r.cuisine_type && <p className="text-xs text-gray-400 truncate">{r.cuisine_type}</p>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Montant */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                <Wallet className="w-3.5 h-3.5 text-orange-500" />
                Montant (F CFA) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 2500"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
              />
              {amount && parseFloat(amount) > ticketBalance && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Solde insuffisant
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                <Receipt className="w-3.5 h-3.5 text-orange-500" />
                Note (optionnel)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Déjeuner du 01/03"
                maxLength={500}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
              />
            </div>

            {/* Bouton */}
            <button
              onClick={handleSubmit}
              disabled={!selectedRestaurant || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > ticketBalance || submitting}
              className={`w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                !selectedRestaurant || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > ticketBalance
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? 'Paiement en cours...' : `Payer ${amount ? formatCurrency(parseFloat(amount) || 0) : ''}`}
            </button>
          </div>
        </div>

        {/* Historique des paiements */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <h3 className="text-base font-semibold text-gray-900">Historique paiements</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-600 rounded-full">{history.length}</span>
              </div>
              {showHistory ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          {showHistory && (
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">Aucun paiement effectué</p>
                </div>
              ) : (
                history.map((payment) => (
                  <div key={payment.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{payment.restaurant_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-gray-400">{payment.reference}</span>
                            <span className="text-[10px] text-gray-300">•</span>
                            <span className="text-[10px] text-gray-400">{formatDate(payment.created_at)}</span>
                          </div>
                          {payment.notes && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">"{payment.notes}"</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!showHistory && history.length > 0 && (
            <div className="divide-y divide-gray-50">
              {history.slice(0, 3).map((payment) => (
                <div key={payment.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{payment.restaurant_name}</p>
                      <p className="text-[10px] text-gray-400">{formatDate(payment.created_at)}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                  </div>
                </div>
              ))}
              {history.length > 3 && (
                <button onClick={() => setShowHistory(true)} className="w-full py-3 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors">
                  Voir tout ({history.length})
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation */}
      {showConfirm && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>

            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center gap-3.5">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Confirmer le paiement</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Vérifiez les détails avant de confirmer</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Restaurant</span>
                  <span className="text-sm font-semibold text-gray-900">{selectedRestaurant.name}</span>
                </div>
                <div className="border-t border-gray-200"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Montant</span>
                  <span className="text-lg font-bold text-orange-600">{formatCurrency(parseFloat(amount))}</span>
                </div>
                {notes && (
                  <>
                    <div className="border-t border-gray-200"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase font-semibold">Note</span>
                      <span className="text-sm text-gray-700">{notes}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-gray-200"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Solde après</span>
                  <span className="text-sm font-semibold text-gray-700">{formatCurrency(ticketBalance - parseFloat(amount))}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Annuler
                </button>
                <button onClick={confirmPayment}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {submitting ? 'En cours...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectPayment;
