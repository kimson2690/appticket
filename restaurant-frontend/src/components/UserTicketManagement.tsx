import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Users,
  Package,
  CheckCircle,
  XCircle,
  X,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Zap,
  FileText,
  Hash,
  Settings,
  CheckCircle2,
  Coins
} from 'lucide-react';
import { apiService, type Employee, type TicketBatch, type TicketConfiguration } from '../services/api';
import Pagination from './Pagination';

const UserTicketManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [batches, setBatches] = useState<TicketBatch[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [configurations, setConfigurations] = useState<TicketConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; title: string } | null>(null);
  const [empPage, setEmpPage] = useState(1);

  const [formData, setFormData] = useState({
    tickets_count: 1,
    batch_id: '',
    config_id: '',
    ticket_value: 500,
    validity_days: 30,
    amount: 0,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeeData, batchData, assignmentData, configData] = await Promise.all([
        apiService.getEmployees(),
        apiService.getTicketBatches(),
        apiService.getTicketAssignments(),
        apiService.getTicketConfigurations()
      ]);
      setEmployees(employeeData);
      setBatches(batchData);
      setAssignments(assignmentData);
      setConfigurations(configData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les données.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTickets = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      tickets_count: 1,
      batch_id: '',
      config_id: '',
      ticket_value: 500,
      validity_days: 30,
      amount: 0,
      notes: ''
    });
    setShowModal(true);
  };

  const handleBulkAssign = () => {
    const defaultConfig = configurations.find(c => c.status === 'active');
    setFormData({
      tickets_count: 20,
      batch_id: '',
      config_id: defaultConfig?.id || '',
      ticket_value: parseFloat(defaultConfig?.ticket_value || '500'),
      validity_days: defaultConfig?.validity_days || 30,
      amount: 0,
      notes: ''
    });
    setShowBulkModal(true);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userName = localStorage.getItem('userName') || 'Utilisateur';
      const result = await apiService.bulkAssignTickets({
        tickets_count: formData.tickets_count,
        ticket_value: formData.ticket_value,
        config_id: formData.config_id,
        notes: formData.notes || undefined,
        created_by: userName
      });
      
      // Rafraîchir les données
      await loadData();
      
      setNotification({
        type: 'success',
        title: 'Affectation groupée réussie',
        message: `${result.success} souche(s) créée(s) et affectée(s). Chaque employé a reçu ${formData.tickets_count} ticket(s).`
      });
      
      setShowBulkModal(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de l\'affectation groupée.'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployee) return;

    try {
      const updatedEmployee = await apiService.assignTicketsToEmployee(selectedEmployee.id, {
        tickets_count: formData.tickets_count,
        ticket_value: formData.ticket_value,
        validity_days: formData.validity_days,
        notes: formData.notes || undefined
      });
      
      setEmployees(employees.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
      
      setNotification({
        type: 'success',
        title: 'Tickets affectés',
        message: `${formData.tickets_count} ticket(s) affecté(s) à ${selectedEmployee.name}.`
      });
      
      await loadData();
      setShowModal(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de l\'opération.'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Actif</span>;
      case 'pending':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">En attente</span>;
      case 'inactive':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactif</span>;
      case 'suspended':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Suspendu</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

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

  const EMP_PER_PAGE = 10;
  const activeEmployees = employees.filter(e => e.status === 'active');
  const paginatedEmployees = activeEmployees.slice((empPage - 1) * EMP_PER_PAGE, empPage * EMP_PER_PAGE);
  
  // Calculer les souches actives (status === 'active')
  const activeBatches = batches.filter(b => b.status === 'active');
  
  // Calculer le total de tickets affectés (depuis les souches, source de vérité)
  const totalTicketsAssigned = batches.reduce((sum, b) => sum + b.total_tickets, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md w-full rounded-2xl shadow-lg border p-4 backdrop-blur-sm ${
          notification.type === 'success' ? 'bg-emerald-50/95 border-emerald-200' :
          notification.type === 'error' ? 'bg-red-50/95 border-red-200' : 'bg-blue-50/95 border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${
              notification.type === 'success' ? 'bg-emerald-100' :
              notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : notification.type === 'error' ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${
                notification.type === 'success' ? 'text-emerald-800' :
                notification.type === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>{notification.title}</p>
              <p className={`text-xs mt-0.5 ${
                notification.type === 'success' ? 'text-emerald-600' :
                notification.type === 'error' ? 'text-red-600' : 'text-blue-600'
              }`}>{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Tickets Employés</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Affectez des tickets à vos employés
          </p>
        </div>
        <button
          onClick={handleBulkAssign}
          className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-purple-100"
        >
          <Zap className="w-4 h-4" />
          <span>Affectation Groupée</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Employés Actifs</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{activeEmployees.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Solde Total Valide</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                {activeEmployees.reduce((sum, emp) => sum + Math.round(Number((emp as any).valid_balance ?? emp.ticket_balance ?? 0)), 0).toLocaleString('fr-FR')}F
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Souches Actives</p>
              <p className="text-3xl font-extrabold text-orange-600 mt-1">{activeBatches.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Tickets Affectés</p>
              <p className="text-3xl font-extrabold text-purple-600 mt-1">{totalTicketsAssigned}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des employés */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Employés</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Solde
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-orange-600">
                          {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                        {employee.employee_number && (
                          <p className="text-[10px] text-gray-400 font-medium">#{employee.employee_number}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{employee.email}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{employee.department || 'N/A'}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-600">{Math.round(Number((employee as any).valid_balance ?? employee.ticket_balance ?? 0)).toLocaleString('fr-FR')}F</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {getStatusBadge(employee.status)}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <button
                      onClick={() => handleAssignTickets(employee)}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-orange-100"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Affecter</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={empPage}
          totalItems={activeEmployees.length}
          itemsPerPage={EMP_PER_PAGE}
          onPageChange={setEmpPage}
        />
      </div>

      {/* Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100">
            <div className="border-b border-gray-100 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Affecter des Tickets
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Info employé */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-orange-600">
                      {selectedEmployee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{selectedEmployee.name}</p>
                    <p className="text-xs text-gray-500">Solde actuel: <span className="font-bold text-emerald-600">{Math.round(Number((selectedEmployee as any).valid_balance ?? selectedEmployee.ticket_balance ?? 0)).toLocaleString('fr-FR')}F</span></p>
                  </div>
                </div>
              </div>

              {/* Nombre de tickets */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Nombre de tickets *
                </label>
                <input
                  type="number"
                  value={formData.tickets_count}
                  onChange={(e) => setFormData({ ...formData, tickets_count: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                  min="1"
                  required
                />
              </div>

              {/* Valeur du ticket */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Valeur du ticket (F CFA) *
                </label>
                <select
                  value={formData.ticket_value}
                  onChange={(e) => setFormData({ ...formData, ticket_value: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                  required
                >
                  {configurations.length > 0 ? (
                    configurations.map((config) => (
                      <option key={config.id} value={config.ticket_value}>
                        {config.ticket_value}F - {config.company_name}
                      </option>
                    ))
                  ) : (
                    <option value="500">500F - standard</option>
                  )}
                </select>
                <p className="mt-1 text-[10px] text-gray-400">
                  Valeurs paramétrées par votre entreprise
                </p>
              </div>

              {/* Nombre de jours de validité */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Validité (jours) *
                </label>
                <input
                  type="number"
                  value={formData.validity_days}
                  onChange={(e) => setFormData({ ...formData, validity_days: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                  min="1"
                  max="365"
                  required
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Les tickets seront valables {formData.validity_days} jour(s) à partir d'aujourd'hui
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Notes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                  rows={3}
                  placeholder="Ajouter une note..."
                />
              </div>

              {/* Boutons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100"
                >
                  Affecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Affectation Groupée */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]"
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-violet-50 to-purple-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Affectation Groupée</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Distribuer des tickets à tous les employés actifs</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleBulkSubmit} className="px-6 pt-6 pb-6 space-y-5">
              {/* Info */}
              <div className="bg-purple-50 border-2 border-purple-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-purple-900 mb-0.5">Génération de souches individuelles</p>
                    <p className="text-xs text-purple-700">
                      Une souche sera créée pour chaque employé actif ({activeEmployees.length}).
                      Chaque souche aura un numéro de suivi unique et contiendra {formData.tickets_count} ticket(s).
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Settings className="w-3.5 h-3.5 text-purple-500" />
                  Configuration de tickets <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.config_id}
                  onChange={(e) => {
                    const selectedConfig = configurations.find(c => c.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      config_id: e.target.value,
                      ticket_value: parseFloat(selectedConfig?.ticket_value || '500')
                    });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 hover:border-gray-200 appearance-none cursor-pointer"
                  required
                >
                  <option value="">Sélectionner une configuration</option>
                  {configurations.filter(c => c.status === 'active').map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.company_name} - {config.ticket_value}F - {config.validity_days} jours
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[10px] text-gray-400">
                  Détermine le type et la durée de validité des souches
                </p>
              </div>

              {/* Valeur du ticket */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Coins className="w-3.5 h-3.5 text-purple-500" />
                  Valeur de chaque ticket <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.ticket_value}
                    onChange={(e) => setFormData({ ...formData, ticket_value: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 hover:border-gray-200"
                    min="100"
                    step="100"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">F CFA</span>
                </div>
              </div>

              {/* Nombre de tickets par employé */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Hash className="w-3.5 h-3.5 text-purple-500" />
                  Nombre de tickets par souche <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.tickets_count}
                  onChange={(e) => setFormData({ ...formData, tickets_count: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 hover:border-gray-200"
                  min="1"
                  required
                />
                <div className="mt-2 bg-purple-50/50 border border-purple-100 rounded-lg p-2.5">
                  <p className="text-xs text-gray-600">
                    <strong className="text-gray-900">{activeEmployees.length} souches</strong> seront créées avec <strong className="text-gray-900">{formData.tickets_count} tickets</strong> chacune
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    Valeur totale distribuée: <strong className="text-purple-600">{(formData.tickets_count * formData.ticket_value * activeEmployees.length).toLocaleString()}F</strong>
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <FileText className="w-3.5 h-3.5 text-purple-500" />
                  Notes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 hover:border-gray-200 resize-none"
                  rows={3}
                  placeholder="Ex: Distribution mensuelle de tickets..."
                />
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-all shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Affecter à tous
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTicketManagement;
