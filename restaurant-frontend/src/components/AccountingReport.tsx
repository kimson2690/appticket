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
        `http://localhost:8001/api/company/reports/accounting?month=${selectedMonth}&year=${selectedYear}`,
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
        'http://localhost:8001/api/company/reports/accounting/export',
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-orange-500" />
          Rapport Comptable Mensuel
        </h1>
        <p className="text-gray-600 mt-2">
          Génération du rapport comptable détaillé avec export Excel
        </p>
      </div>

      {/* Sélection de la période */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900">Sélection de la période</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mois
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Erreur</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          <span className="ml-3 text-gray-600">Chargement du rapport...</span>
        </div>
      )}

      {/* Prévisualisation des données */}
      {!loading && reportData && (
        <>
          {/* Cartes de synthèse */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Tickets affectés */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8" />
                <span className="text-2xl font-bold">
                  {reportData.summary.tickets_assigned_count}
                </span>
              </div>
              <p className="text-blue-100 text-sm">Tickets Affectés</p>
              <p className="text-lg font-semibold mt-1">
                {formatAmount(reportData.summary.tickets_assigned_amount)}
              </p>
            </div>

            {/* Tickets consommés */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <ShoppingCart className="w-8 h-8" />
                <span className="text-2xl font-bold">
                  {reportData.summary.tickets_used_count}
                </span>
              </div>
              <p className="text-green-100 text-sm">Tickets Consommés</p>
              <p className="text-lg font-semibold mt-1">
                {formatAmount(reportData.summary.tickets_used_amount)}
              </p>
              <p className="text-green-200 text-xs mt-1">
                via {reportData.summary.orders_count} commande(s)
              </p>
            </div>

            {/* Employés actifs */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8" />
                <span className="text-2xl font-bold">
                  {reportData.summary.active_employees}
                </span>
              </div>
              <p className="text-purple-100 text-sm">Employés Actifs</p>
              <p className="text-lg font-semibold mt-1">
                {reportData.summary.orders_count} commandes
              </p>
            </div>

            {/* Restaurants */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8" />
                <span className="text-2xl font-bold">
                  {reportData.summary.restaurants_count}
                </span>
              </div>
              <p className="text-orange-100 text-sm">Restaurants Partenaires</p>
              <p className="text-lg font-semibold mt-1">
                Ticket moyen: {formatAmount(reportData.summary.average_order_amount)}
              </p>
            </div>
          </div>

          {/* Détails synthèse */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Synthèse détaillée</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Tickets restants</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {reportData.summary.tickets_remaining_count} tickets
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    ({formatAmount(reportData.summary.tickets_remaining_amount)})
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">Taux d'utilisation</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${reportData.summary.usage_rate}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold text-gray-900 w-16 text-right">
                    {reportData.summary.usage_rate.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Montant moyen par commande</span>
                <span className="font-semibold text-gray-900">
                  {formatAmount(reportData.summary.average_order_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Bouton d'export */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Export Excel
                </h3>
                <p className="text-sm text-gray-600">
                  Téléchargez le rapport complet avec tous les détails (5 onglets)
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Format: .xlsx | Taille estimée: ~150 KB
                </p>
              </div>

              <button
                onClick={exportToExcel}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Télécharger Excel
                  </>
                )}
              </button>
            </div>

            {/* Info sur le contenu */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Contenu du rapport Excel :</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Onglet 1:</strong> Synthèse globale</li>
                <li>• <strong>Onglet 2:</strong> Détail par employé (11 colonnes)</li>
                <li>• <strong>Onglet 3:</strong> Détail par restaurant (7 colonnes)</li>
                <li>• <strong>Onglet 4:</strong> Chronologie par date (8 colonnes)</li>
                <li>• <strong>Onglet 5:</strong> Réconciliation quotidienne (9 colonnes)</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccountingReport;
