import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Building2,
  ShoppingCart,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Summary {
  tickets_assigned_count: number;
  tickets_assigned_amount: number;
  tickets_used_count: number;
  tickets_used_amount: number;
  tickets_remaining_count: number;
  tickets_remaining_amount: number;
  usage_rate: number;
  active_employees: number;
  restaurants_count: number;
  orders_count: number;
  average_order_amount: number;
}

interface AccountingReportData {
  summary: Summary;
  by_employee: any[];
  by_restaurant: any[];
  by_date: any[];
  reconciliation: any[];
}

const AccountingReport: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [reportData, setReportData] = useState<AccountingReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Charger les données au montage et quand période change
  useEffect(() => {
    loadReportData();
  }, [selectedMonth, selectedYear]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      const companyId = localStorage.getItem('userCompanyId');
      const userRole = localStorage.getItem('userRole');

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-User-Role': userRole || ''
      };

      if (companyId) {
        headers['X-User-Company-Id'] = companyId;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/company/reports/accounting?month=${selectedMonth}&year=${selectedYear}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du rapport');
      }

      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
      } else {
        throw new Error(result.error || 'Erreur inconnue');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Erreur chargement rapport:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    setError(null);

    try {
      const companyId = localStorage.getItem('userCompanyId');
      const userRole = localStorage.getItem('userRole');

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-User-Role': userRole || ''
      };

      if (companyId) {
        headers['X-User-Company-Id'] = companyId;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8001/api'}/company/reports/accounting/export`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            month: selectedMonth,
            year: selectedYear
          })
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const monthName = months.find(m => m.value === selectedMonth)?.label || 'Mois';
      a.download = `Rapport_Comptable_${monthName}_${selectedYear}.xlsx`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Toast success
      showToast('Rapport exporté avec succès !', 'success');

    } catch (err: any) {
      setError(err.message);
      showToast('Erreur lors de l\'export', 'error');
      console.error('Erreur export:', err);
    } finally {
      setExporting(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white font-semibold`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' F CFA';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapport Comptable Mensuel</h1>
          <p className="text-sm text-gray-400 mt-0.5">Génération du rapport comptable détaillé avec export Excel</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">
              {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </span>
          </div>
        </div>
      </div>

      {/* Sélection de la période */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-orange-50 rounded-lg">
            <Calendar className="w-4 h-4 text-orange-500" />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Sélection de la période</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Mois</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Année</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-1.5 bg-red-100 rounded-lg flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">Erreur</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="relative w-14 h-14 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-sm text-gray-500 font-medium">Chargement du rapport...</p>
          </div>
        </div>
      )}

      {/* Report Data */}
      {!loading && reportData && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-sm shadow-blue-200 group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-2xl font-extrabold">{reportData.summary.tickets_assigned_count}</span>
              </div>
              <p className="text-blue-100 text-xs font-medium">Tickets Affectés</p>
              <p className="text-base font-bold mt-0.5">{formatAmount(reportData.summary.tickets_assigned_amount)}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-sm shadow-emerald-200 group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="text-2xl font-extrabold">{reportData.summary.tickets_used_count}</span>
              </div>
              <p className="text-emerald-100 text-xs font-medium">Tickets Consommés</p>
              <p className="text-base font-bold mt-0.5">{formatAmount(reportData.summary.tickets_used_amount)}</p>
              <p className="text-emerald-200 text-[10px] mt-1">via {reportData.summary.orders_count} commande(s)</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-sm shadow-purple-200 group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-2xl font-extrabold">{reportData.summary.active_employees}</span>
              </div>
              <p className="text-purple-100 text-xs font-medium">Employés Actifs</p>
              <p className="text-base font-bold mt-0.5">{reportData.summary.orders_count} commandes</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm shadow-orange-200 group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-2xl font-extrabold">{reportData.summary.restaurants_count}</span>
              </div>
              <p className="text-orange-100 text-xs font-medium">Restaurants Partenaires</p>
              <p className="text-base font-bold mt-0.5">Ticket moyen: {formatAmount(reportData.summary.average_order_amount)}</p>
            </div>
          </div>

          {/* Synthèse détaillée */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-base font-bold text-gray-900 mb-4">Synthèse détaillée</h3>
            <div className="space-y-0">
              <div className="flex justify-between items-center py-3.5 border-b border-gray-50">
                <span className="text-sm text-gray-600">Tickets restants</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    {reportData.summary.tickets_remaining_count} tickets
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    ({formatAmount(reportData.summary.tickets_remaining_amount)})
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3.5 border-b border-gray-50">
                <span className="text-sm text-gray-600">Taux d'utilisation</span>
                <div className="flex items-center gap-3">
                  <div className="w-28 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(reportData.summary.usage_rate, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-16 text-right">
                    {reportData.summary.usage_rate.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3.5">
                <span className="text-sm text-gray-600">Montant moyen par commande</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatAmount(reportData.summary.average_order_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Export Excel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-emerald-50 rounded-lg">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Export Excel</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Téléchargez le rapport complet avec tous les détails (5 onglets)
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Format: .xlsx | Taille estimée: ~150 KB
                </p>
              </div>
              <button
                onClick={exportToExcel}
                disabled={exporting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-orange-100 flex-shrink-0"
              >
                {exporting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Export en cours...</>
                ) : (
                  <><Download className="w-4 h-4" /> Télécharger Excel</>
                )}
              </button>
            </div>

            <div className="px-5 pb-5 pt-0">
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Contenu du rapport Excel :</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[
                    { num: 1, title: 'Synthèse globale' },
                    { num: 2, title: 'Détail par employé (11 col.)' },
                    { num: 3, title: 'Détail par restaurant (7 col.)' },
                    { num: 4, title: 'Chronologie par date (8 col.)' },
                    { num: 5, title: 'Réconciliation quotidienne (9 col.)' },
                  ].map((tab) => (
                    <div key={tab.num} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                      <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0">{tab.num}</span>
                      <span className="text-xs text-gray-600">{tab.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountingReport;
