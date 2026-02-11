import React, { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Package, ArrowUpRight, Sparkles, Activity, AlertCircle, X, Calendar, Eye, ChevronRight, Ticket, BarChart3, UtensilsCrossed, CalendarCheck, LayoutGrid, TrendingUp, ArrowDownRight } from 'lucide-react';

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

  useEffect(() => { loadBalance(); }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const headers = { 'Content-Type': 'application/json', 'X-User-Id': userId || '', 'X-User-Name': userName || '' };

      const [balanceRes, batchesRes] = await Promise.all([
        fetch(`${baseUrl}/employee/ticket-balance`, { headers }),
        fetch(`${baseUrl}/employee/my-batches`, { headers }),
      ]);
      const balanceData = await balanceRes.json();
      const batchesData = await batchesRes.json();
      if (balanceData.success) setBalance(balanceData.data);
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

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'decimal', minimumFractionDigits: 0 }).format(n) + 'F';

  const tc = balance?.tickets_count;
  const total = tc?.total || 0;
  const available = tc?.available || 0;
  const used = tc?.used || 0;
  const expired = tc?.expired || 0;
  const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0;
  const usageRate = pct(used);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement de vos tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Tickets Restaurant</h1>
          <p className="text-sm text-gray-400 mt-0.5">Bonjour, {balance?.employee_name || 'Utilisateur'} — suivez votre solde en temps réel</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <CalendarCheck className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* ─── Carte principale - Solde ─── */}
      <div className="relative bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-lg">
        {/* SVG wave decoration */}
        <svg className="absolute right-0 top-0 h-full w-1/3 opacity-10" viewBox="0 0 200 200" preserveAspectRatio="none">
          <path d="M100,0 C130,40 170,60 200,50 L200,200 L0,200 L0,150 C30,130 70,140 100,120 C130,100 70,80 100,50 Z" fill="white"/>
          <path d="M150,0 C170,30 190,60 200,80 L200,200 L100,200 C120,170 140,130 150,100 C160,70 130,40 150,0 Z" fill="white" opacity="0.5"/>
        </svg>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-orange-100 text-xs font-medium uppercase tracking-wider">Solde Disponible</p>
                  <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">{fmt(balance?.ticket_balance || 0)}</h2>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-orange-100 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>Prêt à être utilisé</span>
              </div>
            </div>
          </div>

          {/* 3 sub-cards inside banner */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { label: 'Total Tickets', val: total, icon: LayoutGrid, barW: '100%', barColor: 'bg-white' },
              { label: 'Disponibles', val: available, icon: CheckCircle, barW: `${pct(available)}%`, barColor: 'bg-green-300' },
              { label: 'Utilisés', val: used, icon: Activity, barW: `${pct(used)}%`, barColor: 'bg-blue-300' },
            ].map((c, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/15 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <c.icon className="w-3.5 h-3.5 text-orange-200" />
                  <p className="text-orange-100 text-xs font-medium">{c.label}</p>
                </div>
                <p className="text-2xl md:text-3xl font-bold">{c.val}</p>
                <div className="h-1 w-full bg-white/20 rounded-full mt-2">
                  <div className={`h-full ${c.barColor} rounded-full transition-all duration-700`} style={{ width: c.barW }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 3 Info Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tickets expirés */}
        <div
          onClick={() => setModalType('expired')}
          className="cursor-pointer group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-red-100 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-red-50 rounded-lg"><Clock className="w-4 h-4 text-red-500" /></div>
                <p className="text-sm font-semibold text-gray-600">Tickets Expirés</p>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{expired}</p>
              <p className="text-xs text-gray-400 mt-0.5">Non utilisables</p>
            </div>
            <div className="relative flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#fef2f2" strokeWidth="5" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="#ef4444" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - (total > 0 ? expired / total : 0))}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-red-500">{pct(expired)}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-50 text-xs text-red-400 font-medium group-hover:text-red-600 transition-colors">
            <Eye className="w-3.5 h-3.5" />
            Voir les détails
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Souches actives */}
        <div
          onClick={() => setModalType('valid')}
          className="cursor-pointer group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1.5 bg-blue-50 rounded-lg"><Package className="w-4 h-4 text-blue-500" /></div>
                <p className="text-sm font-semibold text-gray-600">Souches Actives</p>
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{balance?.batches_count || 0}</p>
              <p className="text-xs text-gray-400 mt-0.5">En cours</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-100 group-hover:scale-105 transition-transform">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-50 text-xs text-blue-400 font-medium group-hover:text-blue-600 transition-colors">
            <Eye className="w-3.5 h-3.5" />
            Voir les souches
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Taux d'utilisation */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 bg-emerald-50 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
            <p className="text-sm font-semibold text-gray-600">Taux d'Utilisation</p>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{usageRate}%</p>
          <p className="text-xs text-gray-400 mt-0.5">{used} sur {total} utilisés</p>
          <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden mt-4">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${usageRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── Répartition Détaillée + Conseils ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Répartition */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-gray-900">Répartition Détaillée</h3>
            </div>
            <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
              {total} tickets au total
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Tickets disponibles', sub: 'Prêts à utiliser', count: available, color: 'green', icon: CheckCircle, click: () => setModalType('valid'), arrow: true },
              { label: 'Tickets utilisés', sub: 'Déjà consommés', count: used, color: 'blue', icon: XCircle, click: undefined, arrow: false },
              { label: 'Tickets expirés', sub: 'Périmés', count: expired, color: 'red', icon: Clock, click: () => setModalType('expired'), arrow: true },
            ].map((row, i) => (
              <div
                key={i}
                onClick={row.click}
                className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:shadow-md
                  ${row.click ? 'cursor-pointer' : ''}
                  ${row.color === 'green' ? 'bg-emerald-50/50 border-emerald-100' : row.color === 'blue' ? 'bg-blue-50/50 border-blue-100' : 'bg-red-50/50 border-red-100'}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110
                    ${row.color === 'green' ? 'bg-emerald-100' : row.color === 'blue' ? 'bg-blue-100' : 'bg-red-100'}
                  `}>
                    <row.icon className={`w-5 h-5 ${row.color === 'green' ? 'text-emerald-600' : row.color === 'blue' ? 'text-blue-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">{row.label}</span>
                    <span className="text-xs text-gray-400 block">{row.sub}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-xl font-bold ${row.color === 'green' ? 'text-emerald-600' : row.color === 'blue' ? 'text-blue-600' : 'text-red-600'}`}>
                      {row.count}
                    </span>
                    <p className="text-xs text-gray-400">{pct(row.count)}% du total</p>
                  </div>
                  {row.arrow && (
                    <ChevronRight className={`w-5 h-5 transition-colors ${row.color === 'green' ? 'text-emerald-300 group-hover:text-emerald-600' : 'text-red-300 group-hover:text-red-600'}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conseils */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-4.5 h-4.5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Conseils</h3>
          </div>
          <div className="space-y-3">
            {[
              { icon: Sparkles, title: 'Utilisez vos tickets', desc: "N'oubliez pas d'utiliser vos tickets avant leur expiration pour ne rien perdre." },
              { icon: CalendarCheck, title: 'Vérifiez les dates', desc: "Consultez régulièrement vos souches pour connaître les dates d'expiration." },
              { icon: UtensilsCrossed, title: 'Commandez facilement', desc: 'Utilisez la section "Commander" pour utiliser vos tickets en ligne.' },
            ].map((tip, i) => (
              <div key={i} className="bg-orange-50/60 rounded-xl p-4 border border-orange-100/60 hover:bg-orange-50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <tip.icon className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-semibold text-gray-800">{tip.title}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Modal Détails ─── */}
      {modalType && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalType(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`p-5 ${modalType === 'expired' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {modalType === 'expired' ? <Clock className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{modalType === 'expired' ? 'Tickets Expirés' : 'Tickets Valides'}</h2>
                    <p className="text-sm opacity-80">
                      {modalType === 'expired' ? `${expiredBatches.length} souche(s) expirée(s)` : `${validBatches.length} souche(s) active(s)`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setModalType(null)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto max-h-[60vh]">
              {(modalType === 'expired' ? expiredBatches : validBatches).length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${modalType === 'expired' ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    <Ticket className={`w-8 h-8 ${modalType === 'expired' ? 'text-red-300' : 'text-emerald-300'}`} />
                  </div>
                  <p className="text-gray-400 font-medium">{modalType === 'expired' ? 'Aucun ticket expiré' : 'Aucun ticket valide'}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(modalType === 'expired' ? expiredBatches : validBatches).map((batch) => (
                    <div key={batch.id} className={`rounded-xl border p-5 transition-all hover:shadow-md ${
                      modalType === 'expired' ? 'border-red-100 bg-red-50/30' : 'border-emerald-100 bg-emerald-50/30'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Package className={`w-4 h-4 ${modalType === 'expired' ? 'text-red-500' : 'text-emerald-500'}`} />
                            <span className="font-bold text-gray-900 text-sm">Souche {batch.batch_number}</span>
                          </div>
                          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            modalType === 'expired' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {modalType === 'expired' ? 'Expirée' : 'Active'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-extrabold ${modalType === 'expired' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {batch.remaining_tickets}
                          </p>
                          <p className="text-xs text-gray-400">tickets restants</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 mt-4">
                        {[
                          { label: 'Valeur unitaire', val: fmt(Number(batch.ticket_value)), color: 'text-gray-900' },
                          { label: 'Total tickets', val: String(batch.total_tickets), color: 'text-gray-900' },
                          { label: 'Utilisés', val: String(batch.used_tickets), color: 'text-blue-600' },
                          { label: 'Valeur restante', val: fmt(batch.remaining_tickets * Number(batch.ticket_value)), color: modalType === 'expired' ? 'text-red-600' : 'text-emerald-600' },
                        ].map((cell, j) => (
                          <div key={j} className="bg-white rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-400 mb-0.5">{cell.label}</p>
                            <p className={`text-sm font-bold ${cell.color}`}>{cell.val}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Du {formatDate(batch.validity_start)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Au {formatDate(batch.validity_end)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary */}
                  <div className={`rounded-xl p-4 ${modalType === 'expired' ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${modalType === 'expired' ? 'text-red-700' : 'text-emerald-700'}`}>
                        Total {modalType === 'expired' ? 'perdu' : 'disponible'}
                      </span>
                      <span className={`text-lg font-extrabold ${modalType === 'expired' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {fmt((modalType === 'expired' ? expiredBatches : validBatches).reduce((sum, b) => sum + b.remaining_tickets * Number(b.ticket_value), 0))}
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
