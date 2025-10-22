import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  Users,
  Package,
  CheckCircle,
  XCircle,
  X,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  CreditCard,
  Zap
} from 'lucide-react';
import { apiService, type Employee, type TicketBatch, type TicketAssignment, type TicketConfiguration } from '../services/api';

const UserTicketManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [batches, setBatches] = useState<TicketBatch[]>([]);
  const [assignments, setAssignments] = useState<TicketAssignment[]>([]);
  const [configurations, setConfigurations] = useState<TicketConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [modalType, setModalType] = useState<'assign' | 'recharge'>('assign');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; title: string } | null>(null);

  const [formData, setFormData] = useState({
    tickets_count: 1,
    batch_id: '',
    config_id: '',
    ticket_value: 500,
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
    setModalType('assign');
    setFormData({
      tickets_count: 1,
      batch_id: '',
      config_id: '',
      ticket_value: 500,
      amount: 0,
      notes: ''
    });
    setShowModal(true);
  };

  const handleRechargeBalance = (employee: Employee) => {
    setSelectedEmployee(employee);
    setModalType('recharge');
    setFormData({
      tickets_count: 1,
      batch_id: '',
      config_id: '',
      ticket_value: 500,
      amount: 500,
      notes: ''
    });
    setShowModal(true);
  };

  const handleBulkAssign = () => {
    const defaultConfig = configurations.find(c => c.is_active);
    setFormData({
      tickets_count: 20,
      batch_id: '',
      config_id: defaultConfig?.id || '',
      ticket_value: defaultConfig?.ticket_value || 500,
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
      if (modalType === 'assign') {
        const updatedEmployee = await apiService.assignTicketsToEmployee(selectedEmployee.id, {
          tickets_count: formData.tickets_count,
          batch_id: formData.batch_id || undefined,
          notes: formData.notes || undefined
        });
        
        setEmployees(employees.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
        
        setNotification({
          type: 'success',
          title: 'Tickets affectés',
          message: `${formData.tickets_count} ticket(s) affecté(s) à ${selectedEmployee.name}.`
        });
      } else {
        const updatedEmployee = await apiService.rechargeEmployeeBalance(selectedEmployee.id, {
          amount: formData.amount,
          notes: formData.notes || undefined
        });
        
        setEmployees(employees.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp));
        
        setNotification({
          type: 'success',
          title: 'Solde rechargé',
          message: `Solde de ${selectedEmployee.name} rechargé de ${formData.amount}F.`
        });
      }
      
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
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const activeEmployees = employees.filter(e => e.status === 'active');
  
  // Calculer les souches actives (status === 'active')
  const activeBatches = batches.filter(b => b.status === 'active');
  
  // Calculer le total de tickets affectés (somme de tous les tickets_count)
  const totalTicketsAssigned = assignments.reduce((sum, assignment) => sum + assignment.tickets_count, 0);

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
          <div className={`flex items-start space-x-4 rounded-2xl p-5 shadow-2xl backdrop-blur-sm min-w-[400px] max-w-2xl ${
            notification.type === 'success' 
              ? 'bg-green-50/95 border-2 border-green-200' 
              : notification.type === 'error'
              ? 'bg-red-50/95 border-2 border-red-200'
              : 'bg-blue-50/95 border-2 border-blue-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : notification.type === 'error' ? (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 ${
                notification.type === 'success' 
                  ? 'text-green-900' 
                  : notification.type === 'error'
                  ? 'text-red-900'
                  : 'text-blue-900'
              }`}>
                {notification.title}
              </h3>
              <p className={`text-sm ${
                notification.type === 'success' 
                  ? 'text-green-800' 
                  : notification.type === 'error'
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className={`p-1 rounded-lg transition-colors ${
                notification.type === 'success' 
                  ? 'hover:bg-green-100' 
                  : notification.type === 'error'
                  ? 'hover:bg-red-100'
                  : 'hover:bg-blue-100'
              }`}
            >
              <X className={`w-5 h-5 ${
                notification.type === 'success' 
                  ? 'text-green-600' 
                  : notification.type === 'error'
                  ? 'text-red-600'
                  : 'text-blue-600'
              }`} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Tickets Employés</h1>
          <p className="text-gray-600">
            Affectez des tickets ou rechargez le solde de vos employés
          </p>
        </div>
        <button
          onClick={handleBulkAssign}
          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors"
        >
          <Zap className="w-5 h-5" />
          <span>Affectation Groupée</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Employés Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activeEmployees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Solde Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeEmployees.reduce((sum, emp) => sum + emp.ticket_balance, 0)}F
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Souches Actives</p>
              <p className="text-2xl font-bold text-gray-900">{activeBatches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tickets Affectés</p>
              <p className="text-2xl font-bold text-gray-900">{totalTicketsAssigned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des employés */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Employés</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-orange-600">
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        {employee.employee_number && (
                          <div className="text-sm text-gray-500">#{employee.employee_number}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.department || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Wallet className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-semibold text-green-600">{employee.ticket_balance}F</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleAssignTickets(employee)}
                        className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs font-medium flex items-center space-x-1"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Affecter</span>
                      </button>
                      <button
                        onClick={() => handleRechargeBalance(employee)}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs font-medium flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Recharger</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {modalType === 'assign' ? 'Affecter des Tickets' : 'Recharger le Solde'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Info employé */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">
                      {selectedEmployee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedEmployee.name}</p>
                    <p className="text-sm text-gray-600">Solde actuel: {selectedEmployee.ticket_balance}F</p>
                  </div>
                </div>
              </div>

              {modalType === 'assign' ? (
                <>
                  {/* Souche */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Souche (optionnel)
                    </label>
                    <select
                      value={formData.batch_id}
                      onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Affectation manuelle</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batch_number || `Souche #${batch.id.split('_')[1]}`} - {batch.type} - {batch.remaining_tickets} restants
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nombre de tickets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de tickets *
                    </label>
                    <input
                      type="number"
                      value={formData.tickets_count}
                      onChange={(e) => setFormData({ ...formData, tickets_count: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Montant */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant (F CFA) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        min="1"
                        step="50"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={3}
                  placeholder="Ajouter une note..."
                />
              </div>

              {/* Boutons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors"
                >
                  {modalType === 'assign' ? 'Affecter' : 'Recharger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Affectation Groupée */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Affectation Groupée</h2>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleBulkSubmit} className="p-6 space-y-6">
              {/* Info */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-purple-900 mb-1">Génération de souches individuelles</p>
                    <p className="text-sm text-purple-800">
                      Une souche sera créée pour chaque employé actif ({activeEmployees.length}).
                      Chaque souche aura un numéro de suivi unique et contiendra {formData.tickets_count} ticket(s).
                    </p>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration de tickets *
                </label>
                <select
                  value={formData.config_id}
                  onChange={(e) => {
                    const selectedConfig = configurations.find(c => c.id === e.target.value);
                    setFormData({ 
                      ...formData, 
                      config_id: e.target.value,
                      ticket_value: selectedConfig?.ticket_value || 500
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une configuration</option>
                  {configurations.filter(c => c.is_active).map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.type} - {config.ticket_value}F - {config.validity_duration_days} jours
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Détermine le type et la durée de validité des souches
                </p>
              </div>

              {/* Valeur du ticket */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valeur de chaque ticket *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.ticket_value}
                    onChange={(e) => setFormData({ ...formData, ticket_value: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="100"
                    step="100"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">F CFA</span>
                </div>
              </div>

              {/* Nombre de tickets par employé */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de tickets par souche *
                </label>
                <input
                  type="number"
                  value={formData.tickets_count}
                  onChange={(e) => setFormData({ ...formData, tickets_count: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="1"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  <strong>{activeEmployees.length} souches</strong> seront créées avec <strong>{formData.tickets_count} tickets</strong> chacune
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Valeur totale distribuée: <strong>{(formData.tickets_count * formData.ticket_value * activeEmployees.length).toLocaleString()}F</strong>
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Ex: Distribution mensuelle de tickets..."
                />
              </div>

              {/* Boutons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium transition-colors flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Affecter à tous</span>
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
