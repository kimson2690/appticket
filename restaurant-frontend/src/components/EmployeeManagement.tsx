import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Building2,
  Briefcase,
  CreditCard,
  Mail,
  Phone,
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import { apiService, type Employee, type Company } from '../services/api';

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('');
  const [selectedPendingEmployee, setSelectedPendingEmployee] = useState<Employee | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; title: string } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [employeeToReject, setEmployeeToReject] = useState<string | null>(null);

  // Récupération des informations de l'utilisateur connecté
  const currentUser = {
    role: localStorage.getItem('userRole') || 'Utilisateur',
    companyId: localStorage.getItem('userCompanyId') || null,
    companyName: localStorage.getItem('userCompanyName') || ''
  };

  // Vérifier si l'utilisateur est un gestionnaire d'entreprise
  const isCompanyManager = currentUser.role === 'Gestionnaire Entreprise';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    company_id: '',
    department: '',
    position: '',
    employee_number: '',
    ticket_balance: 0,
    status: 'active' as 'active' | 'inactive' | 'suspended' | 'pending',
    hire_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, companiesData] = await Promise.all([
        apiService.getEmployees().catch(() => []),
        apiService.getCompanies().catch(() => [])
      ]);
      
      setEmployees(employeesData);
      setCompanies(companiesData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = () => {
    setSelectedEmployee(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      company_id: isCompanyManager ? (currentUser.companyId || '') : '',
      department: '',
      position: '',
      employee_number: '',
      ticket_balance: 0,
      status: 'active',
      hire_date: ''
    });
    setShowModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      password: '',
      company_id: employee.company_id,
      department: employee.department || '',
      position: employee.position || '',
      employee_number: employee.employee_number || '',
      ticket_balance: employee.ticket_balance,
      status: employee.status,
      hire_date: employee.hire_date || ''
    });
    setShowModal(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== DÉBUT SAUVEGARDE EMPLOYÉ ===');
    console.log('FormData envoyé:', formData);
    console.log('SelectedEmployee:', selectedEmployee);
    
    try {
      if (selectedEmployee) {
        console.log('Mode modification - ID:', selectedEmployee.id);
        const updatedEmployee = await apiService.updateEmployee(selectedEmployee.id, formData);
        console.log('Employé mis à jour:', updatedEmployee);
        setEmployees(employees.map(emp => 
          emp.id === selectedEmployee.id ? updatedEmployee : emp
        ));
      } else {
        console.log('Mode création - Données:', formData);
        const newEmployee = await apiService.createEmployee(formData);
        console.log('Nouvel employé créé:', newEmployee);
        setEmployees([...employees, newEmployee]);
      }
      console.log('Sauvegarde réussie - Fermeture du modal');
      setShowModal(false);
    } catch (error) {
      console.error('=== ERREUR DÉTAILLÉE ===');
      console.error('Type d\'erreur:', typeof error);
      console.error('Erreur complète:', error);
      console.error('Message:', error instanceof Error ? error.message : 'Erreur inconnue');
      console.error('Stack:', error instanceof Error ? error.stack : 'Pas de stack');
      
      let errorMessage = 'Erreur inconnue lors de la sauvegarde';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Si c'est une erreur de validation, essayons d'extraire plus de détails
        if (error.message.includes('Données invalides')) {
          errorMessage = 'Données invalides. Vérifiez que tous les champs obligatoires sont remplis correctement.';
        }
      }
      
      setNotification({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: `Erreur lors de la sauvegarde de l'employé: ${errorMessage}`
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedEmployee) {
      try {
        await apiService.deleteEmployee(selectedEmployee.id);
        setEmployees(employees.filter(emp => emp.id !== selectedEmployee.id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setNotification({
          type: 'error',
          title: 'Erreur de suppression',
          message: 'Une erreur est survenue lors de la suppression de l\'employé.'
        });
      }
    }
    setShowDeleteModal(false);
    setSelectedEmployee(null);
  };

  // Filtrer les employés par entreprise
  let filteredEmployees = employees;
  
  // Si c'est un gestionnaire d'entreprise, filtrer par son entreprise uniquement
  if (isCompanyManager && currentUser.companyId) {
    filteredEmployees = employees.filter(emp => String(emp.company_id) === String(currentUser.companyId));
  }
  
  // Appliquer le filtre de sélection d'entreprise (pour les administrateurs)
  if (selectedCompanyFilter && !isCompanyManager) {
    filteredEmployees = filteredEmployees.filter(emp => String(emp.company_id) === String(selectedCompanyFilter));
  }

  // Statistiques basées sur les employés visibles
  const totalEmployees = filteredEmployees.length;
  const activeEmployees = filteredEmployees.filter(emp => emp.status === 'active').length;
  const pendingEmployees = filteredEmployees.filter(emp => emp.status === 'pending');
  const totalTickets = filteredEmployees.reduce((sum, emp) => sum + Number(emp.ticket_balance || 0), 0);

  // Fonction pour approuver un employé
  const handleApproveEmployee = async (employeeId: string) => {
    try {
      await apiService.updateEmployee(employeeId, { status: 'active' });
      // Recharger la liste des employés
      loadData();
      setNotification({
        type: 'success',
        title: 'Employé approuvé',
        message: 'L\'employé a été approuvé avec succès et peut maintenant se connecter à l\'application.'
      });
      // Auto-fermer après 4 secondes
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      setNotification({
        type: 'error',
        title: 'Erreur d\'approbation',
        message: 'Une erreur est survenue lors de l\'approbation de l\'employé. Veuillez réessayer.'
      });
    }
  };

  // Fonction pour rejeter un employé
  const handleRejectEmployee = (employeeId: string) => {
    setEmployeeToReject(employeeId);
    setShowRejectModal(true);
  };

  // Fonction pour confirmer le rejet
  const handleConfirmReject = async () => {
    if (employeeToReject) {
      try {
        await apiService.deleteEmployee(employeeToReject);
        // Recharger la liste des employés
        loadData();
        setNotification({
          type: 'info',
          title: 'Demande rejetée',
          message: 'La demande d\'inscription a été rejetée et supprimée.'
        });
        // Auto-fermer après 4 secondes
        setTimeout(() => setNotification(null), 4000);
      } catch (error) {
        console.error('Erreur lors du rejet:', error);
        setNotification({
          type: 'error',
          title: 'Erreur de rejet',
          message: 'Une erreur est survenue lors du rejet de la demande. Veuillez réessayer.'
        });
      }
    }
    setShowRejectModal(false);
    setEmployeeToReject(null);
  };

  // Fonction pour ouvrir la modal de détails
  const handleViewDetails = (employee: Employee) => {
    console.log('📋 Détails de l\'employé:', employee);
    console.log('📅 Date d\'embauche:', employee.hire_date);
    setSelectedPendingEmployee(employee);
    setIsDetailsModalOpen(true);
  };

  // Fonction pour fermer la modal de détails
  const handleCloseDetailsModal = () => {
    setSelectedPendingEmployee(null);
    setIsDetailsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des employés...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Employés</h1>
          <p className="text-gray-600">
            {isCompanyManager 
              ? `Gérez les employés de ${currentUser.companyName || 'votre entreprise'}`
              : 'Gérez les employés de vos entreprises partenaires'
            }
          </p>
        </div>
        <button
          onClick={handleCreateEmployee}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvel Employé</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className={`grid grid-cols-1 gap-6 ${isCompanyManager ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employés</p>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Employés Actifs</p>
              <p className="text-2xl font-bold text-green-600">{activeEmployees}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-purple-600">{totalTickets.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Carte Entreprises - Seulement pour les administrateurs */}
        {!isCompanyManager && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entreprises</p>
                <p className="text-2xl font-bold text-indigo-600">{companies.length}</p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters - Seulement pour les administrateurs */}
      {!isCompanyManager && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filtrer par entreprise :</label>
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Toutes les entreprises</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Section des demandes en attente - Seulement pour les gestionnaires d'entreprise */}
      {isCompanyManager && pendingEmployees.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Demandes en attente de validation</h2>
              <p className="text-gray-600 mt-1">{pendingEmployees.length} demande{pendingEmployees.length > 1 ? 's' : ''} à traiter</p>
            </div>
            <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
              {pendingEmployees.length} en attente
            </div>
          </div>
          
          <div className="space-y-4">
            {pendingEmployees.map((employee) => (
              <div key={employee.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {employee.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{employee.name}</h3>
                        <p className="text-sm text-gray-600">{employee.email}</p>
                        {employee.phone && <p className="text-sm text-gray-500">{employee.phone}</p>}
                      </div>
                      <div className="text-right">
                        {employee.department && (
                          <p className="text-sm font-medium text-gray-700">{employee.department}</p>
                        )}
                        {employee.position && (
                          <p className="text-sm text-gray-500">{employee.position}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 ml-6">
                    <button
                      onClick={() => handleViewDetails(employee)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Voir détails</span>
                    </button>
                    <button
                      onClick={() => handleApproveEmployee(employee.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <span>✓</span>
                      <span>Approuver</span>
                    </button>
                    <button
                      onClick={() => handleRejectEmployee(employee.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <span>✗</span>
                      <span>Rejeter</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entreprise
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets
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
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {employee.email}
                        </div>
                        {employee.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {employee.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{employee.company_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {employee.position && (
                        <div className="flex items-center">
                          <Briefcase className="w-3 h-3 text-gray-400 mr-1" />
                          {employee.position}
                        </div>
                      )}
                      {employee.department && (
                        <div className="text-xs text-gray-500">{employee.department}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CreditCard className="w-4 h-4 text-purple-400 mr-2" />
                      <span className="text-sm font-medium text-purple-600">
                        {employee.ticket_balance.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : employee.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                       employee.status === 'inactive' ? <Clock className="w-3 h-3 mr-1" /> :
                       <XCircle className="w-3 h-3 mr-1" />}
                      {employee.status === 'active' ? 'Actif' :
                       employee.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditEmployee(employee)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(employee)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedEmployee ? 'Modifier l\'Employé' : 'Nouvel Employé'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: Moussa Kaboré"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="moussa@entreprise.bf"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="+226 70 12 34 56"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedEmployee ? 'Nouveau mot de passe' : 'Mot de passe *'}
                    </label>
                    <input
                      type="password"
                      required={!selectedEmployee}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={selectedEmployee ? "Laisser vide pour ne pas changer" : "••••••••"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entreprise *
                    </label>
                    {isCompanyManager ? (
                      <div className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-gray-700">
                        {currentUser.companyName || 'Entreprise non définie'}
                      </div>
                    ) : (
                      <select
                        required
                        value={formData.company_id}
                        onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner une entreprise</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Département
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: IT, RH, Finance"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poste
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: Développeur, Manager"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro d'employé
                    </label>
                    <input
                      type="text"
                      value={formData.employee_number}
                      onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ex: EMP001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Solde de tickets initial
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.ticket_balance}
                      onChange={(e) => setFormData({ ...formData, ticket_balance: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="suspended">Suspendu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date d'embauche
                    </label>
                    <input
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
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
                    {selectedEmployee ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Supprimer l'employé
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Êtes-vous sûr de vouloir supprimer <strong>{selectedEmployee.name}</strong> ? 
              Cette action est irréversible.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full">
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Rejeter la demande
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Êtes-vous sûr de vouloir rejeter cette demande d'inscription ? 
              Cette action est <strong>irréversible</strong> et l'employé devra soumettre une nouvelle demande.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setEmployeeToReject(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors"
              >
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails pour les employés en attente */}
      {isDetailsModalOpen && selectedPendingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header de la modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Détails de la demande d'inscription</h2>
                  <p className="text-sm text-gray-600 mt-1">Vérification des informations soumises</p>
                </div>
                <button
                  onClick={handleCloseDetailsModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Contenu de la modal */}
            <div className="p-6">
              {/* Avatar et informations principales */}
              <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {selectedPendingEmployee.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPendingEmployee.name}</h3>
                  <p className="text-gray-600">{selectedPendingEmployee.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                      En attente de validation
                    </span>
                  </div>
                </div>
              </div>

              {/* Grille d'informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2 border-b pb-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <span>Informations personnelles</span>
                  </h4>
                  
                  <div className="space-y-3 pl-1">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nom complet</label>
                      <p className="text-gray-900 mt-1">{selectedPendingEmployee.name}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 flex items-center space-x-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedPendingEmployee.email}</span>
                      </p>
                    </div>
                    
                    {selectedPendingEmployee.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Téléphone</label>
                        <p className="text-gray-900 flex items-center space-x-2 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{selectedPendingEmployee.phone}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2 border-b pb-2">
                    <Briefcase className="w-5 h-5 text-gray-500" />
                    <span>Informations professionnelles</span>
                  </h4>
                  
                  <div className="space-y-3 pl-1">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Entreprise</label>
                      <p className="text-gray-900 flex items-center space-x-2 mt-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{selectedPendingEmployee.company_name}</span>
                      </p>
                    </div>
                    
                    {selectedPendingEmployee.department && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Département</label>
                        <p className="text-gray-900 mt-1">{selectedPendingEmployee.department}</p>
                      </div>
                    )}
                    
                    {selectedPendingEmployee.position && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Poste</label>
                        <p className="text-gray-900 mt-1">{selectedPendingEmployee.position}</p>
                      </div>
                    )}
                    
                    {selectedPendingEmployee.employee_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Numéro d'employé</label>
                        <p className="text-gray-900 mt-1">{selectedPendingEmployee.employee_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations système */}
                <div className="space-y-4 md:col-span-2 mt-2">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2 border-b pb-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span>Informations complémentaires</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-1">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Statut</label>
                      <p className="mt-1">
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                          En attente
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Solde de tickets</label>
                      <p className="text-gray-900 flex items-center space-x-2 mt-1">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span>{selectedPendingEmployee.ticket_balance || 0}</span>
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date d'embauche</label>
                      <p className="text-gray-900 mt-1">
                        {(() => {
                          if (!selectedPendingEmployee.hire_date || selectedPendingEmployee.hire_date.trim() === '') {
                            return <span className="text-gray-400 italic">Non renseignée</span>;
                          }
                          try {
                            const date = new Date(selectedPendingEmployee.hire_date);
                            if (isNaN(date.getTime())) {
                              return <span className="text-gray-400 italic">Date invalide</span>;
                            }
                            return date.toLocaleDateString('fr-FR', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            });
                          } catch (error) {
                            console.error('Erreur de formatage de la date:', error);
                            return <span className="text-gray-400 italic">Erreur de format</span>;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCloseDetailsModal}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    handleRejectEmployee(selectedPendingEmployee.id);
                    handleCloseDetailsModal();
                  }}
                  className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Rejeter la demande</span>
                </button>
                <button
                  onClick={() => {
                    handleApproveEmployee(selectedPendingEmployee.id);
                    handleCloseDetailsModal();
                  }}
                  className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approuver la demande</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
