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
  Eye,
  Ticket,
  ShoppingCart,
  Calendar,
  TrendingUp,
  CalendarDays,
  ChevronDown
} from 'lucide-react';
import { apiService, type Employee, type Company } from '../services/api';
import Pagination from './Pagination';

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
  const [validTicketBalance, setValidTicketBalance] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [employeeDetail, setEmployeeDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [empMgmtPage, setEmpMgmtPage] = useState(1);

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

      // Charger le solde valide des tickets (non expirés)
      if (isCompanyManager) {
        try {
          const analytics = await apiService.getTicketAnalytics();
          setValidTicketBalance(analytics?.summary?.valid_remaining_amount ?? null);
        } catch {
          setValidTicketBalance(null);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (employeeId: string) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      setEmployeeDetail(null);
      const data = await apiService.getEmployeeDetail(employeeId);
      setEmployeeDetail(data);
    } catch (err) {
      console.error('Erreur chargement détails:', err);
    } finally {
      setDetailLoading(false);
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

  const EMP_MGMT_PER_PAGE = 10;
  const paginatedFilteredEmployees = filteredEmployees.slice((empMgmtPage - 1) * EMP_MGMT_PER_PAGE, empMgmtPage * EMP_MGMT_PER_PAGE);

  // Statistiques basées sur les employés visibles
  const totalEmployees = filteredEmployees.length;
  const activeEmployees = filteredEmployees.filter(emp => emp.status === 'active').length;
  const pendingEmployees = filteredEmployees.filter(emp => emp.status === 'pending');
  const totalTickets = filteredEmployees.reduce((sum, emp) => sum + Number((emp as any).valid_balance ?? emp.ticket_balance ?? 0), 0);

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

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className={`rounded-2xl shadow-lg border p-4 flex items-center gap-3 backdrop-blur-sm ${
            notification.type === 'success' ? 'bg-emerald-50/95 border-emerald-200' :
            notification.type === 'error' ? 'bg-red-50/95 border-red-200' :
            'bg-blue-50/95 border-blue-200'
          }`}>
            {notification.type === 'success' ? (
              <div className="p-1.5 bg-emerald-100 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
            ) : notification.type === 'error' ? (
              <div className="p-1.5 bg-red-100 rounded-lg"><XCircle className="w-4 h-4 text-red-600" /></div>
            ) : (
              <div className="p-1.5 bg-blue-100 rounded-lg"><AlertTriangle className="w-4 h-4 text-blue-600" /></div>
            )}
            <div>
              <p className={`text-sm font-semibold ${
                notification.type === 'success' ? 'text-emerald-900' :
                notification.type === 'error' ? 'text-red-900' : 'text-blue-900'
              }`}>{notification.title}</p>
              <p className={`text-xs ${
                notification.type === 'success' ? 'text-emerald-700' :
                notification.type === 'error' ? 'text-red-700' : 'text-blue-700'
              }`}>{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors ml-2">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Employés</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isCompanyManager 
              ? `Gérez les employés de ${currentUser.companyName || 'votre entreprise'}`
              : 'Gérez les employés de vos entreprises partenaires'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{dateStr}</span>
          </div>
          <button
            onClick={handleCreateEmployee}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100"
          >
            <Plus className="w-4 h-4" />
            Nouvel Employé
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={`grid grid-cols-2 gap-4 ${isCompanyManager ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
        {[
          { label: 'Total Employés', value: totalEmployees, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Employés Actifs', value: activeEmployees, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Solde Tickets Valides', value: (validTicketBalance !== null ? Math.round(validTicketBalance).toLocaleString('fr-FR') : Math.round(totalTickets).toLocaleString('fr-FR')) + ' F', icon: CreditCard, color: 'bg-purple-50 text-purple-600', isText: true },
          ...(!isCompanyManager ? [{ label: 'Entreprises', value: companies.length, icon: Building2, color: 'bg-indigo-50 text-indigo-600' }] : []),
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`mt-1 font-extrabold ${(s as any).isText ? 'text-xl text-purple-600' : 'text-3xl text-gray-900'}`}>
                  {s.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${s.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters - Seulement pour les administrateurs */}
      {!isCompanyManager && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Filtrer par entreprise</span>
          <div className="relative">
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="appearance-none px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300 pr-10 bg-white shadow-sm"
            >
              <option value="">Toutes les entreprises</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Section des demandes en attente */}
      {isCompanyManager && pendingEmployees.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
              <h3 className="text-base font-bold text-gray-900">Demandes en attente</h3>
              <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">
                {pendingEmployees.length} à traiter
              </span>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingEmployees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between px-5 py-4 hover:bg-orange-50/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-orange-600">
                      {employee.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                    <p className="text-xs text-gray-400">{employee.email}</p>
                  </div>
                  <div className="hidden md:block ml-4">
                    {employee.position && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-gray-50 border border-gray-100 text-gray-600">
                        <Briefcase className="w-3 h-3" />{employee.position}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => handleViewDetails(employee)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleApproveEmployee(employee.id)}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 border border-emerald-200 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleRejectEmployee(employee.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 transition-colors">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Employé</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Entreprise</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Poste</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Solde (F CFA)</th>
                <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFilteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Aucun employé trouvé</p>
                  </td>
                </tr>
              ) : (
                paginatedFilteredEmployees.map((employee, idx) => (
                  <tr key={employee.id} className={`hover:bg-orange-50/30 transition-colors cursor-pointer ${idx !== paginatedFilteredEmployees.length - 1 ? 'border-b border-gray-50' : ''}`} onClick={() => handleViewDetail(employee.id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-orange-600">
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{employee.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{employee.email}</span>
                          </div>
                          {employee.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{employee.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-blue-50 border-blue-200 text-blue-700">
                        <Building2 className="w-3 h-3" />
                        {employee.company_name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {employee.position ? (
                        <div>
                          <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                            <Briefcase className="w-3 h-3 text-gray-400" />
                            {employee.position}
                          </div>
                          {employee.department && (
                            <p className="text-xs text-gray-400 mt-0.5 ml-4">{employee.department}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-emerald-600">
                        {Math.round(Number((employee as any).valid_balance ?? employee.ticket_balance)).toLocaleString('fr-FR')} F
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        employee.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        employee.status === 'inactive' ? 'bg-gray-50 border-gray-200 text-gray-600' :
                        'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          employee.status === 'active' ? 'bg-emerald-400' :
                          employee.status === 'inactive' ? 'bg-gray-400' : 'bg-red-400'
                        }`}></span>
                        {employee.status === 'active' ? 'Actif' :
                         employee.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); handleEditEmployee(employee); }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(employee); }}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={empMgmtPage}
          totalItems={filteredEmployees.length}
          itemsPerPage={EMP_MGMT_PER_PAGE}
          onPageChange={setEmpMgmtPage}
        />
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {selectedEmployee ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedEmployee ? 'Modifier l\'Employé' : 'Nouvel Employé'}</h2>
                  <p className="text-sm text-orange-100">Remplissez les informations de l'employé</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="Ex: Moussa Kaboré" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="moussa@entreprise.bf" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
                  <input type="tel" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="+226 70 12 34 56" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {selectedEmployee ? 'Nouveau mot de passe' : 'Mot de passe *'}
                  </label>
                  <input type="password" required={!selectedEmployee} value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder={selectedEmployee ? "Laisser vide pour ne pas changer" : "••••••••"} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Entreprise *</label>
                  {isCompanyManager ? (
                    <div className="w-full px-3.5 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-700">
                      {currentUser.companyName || 'Entreprise non définie'}
                    </div>
                  ) : (
                    <select required value={formData.company_id}
                      onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300">
                      <option value="">Sélectionner une entreprise</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Département</label>
                  <input type="text" value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="Ex: IT, RH, Finance" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Poste</label>
                  <input type="text" value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="Ex: Développeur, Manager" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro d'employé</label>
                  <input type="text" value={formData.employee_number}
                    onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="Ex: EMP001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Solde de tickets initial</label>
                  <input type="number" min="0" value={formData.ticket_balance}
                    onChange={(e) => setFormData({ ...formData, ticket_balance: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300">
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date d'embauche</label>
                  <input type="date" value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                  {selectedEmployee ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Supprimer l'employé</h3>
                  <p className="text-sm text-red-100">Cette action est irréversible</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-5">
                Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-gray-900">"{selectedEmployee.name}"</span> ?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowRejectModal(false); setEmployeeToReject(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Rejeter la demande</h3>
                  <p className="text-sm text-orange-100">L'employé devra soumettre une nouvelle demande</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-5">
                Êtes-vous sûr de vouloir rejeter cette demande d'inscription ? Cette action est <span className="font-semibold text-gray-900">irréversible</span>.
              </p>
              <div className="flex gap-3">
                <button onClick={() => { setShowRejectModal(false); setEmployeeToReject(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button onClick={handleConfirmReject}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                  Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails pour les employés en attente */}
      {isDetailsModalOpen && selectedPendingEmployee && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCloseDetailsModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {selectedPendingEmployee.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{selectedPendingEmployee.name}</h2>
                  <p className="text-sm text-orange-100">{selectedPendingEmployee.email}</p>
                </div>
                <span className="px-2.5 py-1 bg-white/20 rounded-lg text-xs font-semibold">En attente</span>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Informations personnelles */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Informations personnelles
                  </h4>
                  <div className="space-y-2.5 bg-gray-50 rounded-xl p-4">
                    <div>
                      <p className="text-xs text-gray-400">Nom complet</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedPendingEmployee.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="text-sm text-gray-700 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />{selectedPendingEmployee.email}</p>
                    </div>
                    {selectedPendingEmployee.phone && (
                      <div>
                        <p className="text-xs text-gray-400">Téléphone</p>
                        <p className="text-sm text-gray-700 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{selectedPendingEmployee.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5" /> Informations professionnelles
                  </h4>
                  <div className="space-y-2.5 bg-gray-50 rounded-xl p-4">
                    <div>
                      <p className="text-xs text-gray-400">Entreprise</p>
                      <p className="text-sm text-gray-700 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-gray-400" />{selectedPendingEmployee.company_name}</p>
                    </div>
                    {selectedPendingEmployee.department && (
                      <div>
                        <p className="text-xs text-gray-400">Département</p>
                        <p className="text-sm font-medium text-gray-700">{selectedPendingEmployee.department}</p>
                      </div>
                    )}
                    {selectedPendingEmployee.position && (
                      <div>
                        <p className="text-xs text-gray-400">Poste</p>
                        <p className="text-sm font-medium text-gray-700">{selectedPendingEmployee.position}</p>
                      </div>
                    )}
                    {selectedPendingEmployee.employee_number && (
                      <div>
                        <p className="text-xs text-gray-400">Numéro d'employé</p>
                        <p className="text-sm font-mono text-gray-700">{selectedPendingEmployee.employee_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Infos complémentaires */}
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Informations complémentaires
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-amber-600 font-medium">Statut</p>
                      <p className="text-sm font-bold text-amber-700 mt-0.5">En attente</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-purple-600 font-medium">Solde tickets</p>
                      <p className="text-sm font-bold text-purple-700 mt-0.5">{selectedPendingEmployee.ticket_balance || 0}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-blue-600 font-medium">Date d'embauche</p>
                      <p className="text-sm font-bold text-blue-700 mt-0.5">
                        {(() => {
                          if (!selectedPendingEmployee.hire_date || selectedPendingEmployee.hire_date.trim() === '') {
                            return <span className="text-gray-400 italic font-normal">Non renseignée</span>;
                          }
                          try {
                            const date = new Date(selectedPendingEmployee.hire_date);
                            if (isNaN(date.getTime())) return <span className="text-gray-400 italic font-normal">Invalide</span>;
                            return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
                          } catch (error) {
                            console.error('Erreur de formatage de la date:', error);
                            return <span className="text-gray-400 italic font-normal">Erreur</span>;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={handleCloseDetailsModal}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Fermer
              </button>
              <button onClick={() => { handleRejectEmployee(selectedPendingEmployee.id); handleCloseDetailsModal(); }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Rejeter
              </button>
              <button onClick={() => { handleApproveEmployee(selectedPendingEmployee.id); handleCloseDetailsModal(); }}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Approuver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                </div>
              </div>
            ) : employeeDetail ? (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold">
                        {employeeDetail.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold">{employeeDetail.name}</h3>
                      <p className="text-sm text-orange-100">{employeeDetail.email} · {employeeDetail.phone}</p>
                      <p className="text-xs text-orange-200">{employeeDetail.position} — {employeeDetail.department}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">
                  {/* Stats cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Souches actives', value: employeeDetail.stats?.active_batches ?? 0, icon: Ticket, color: 'bg-blue-50 text-blue-600' },
                      { label: 'Solde valide', value: Math.round(employeeDetail.valid_balance || 0).toLocaleString('fr-FR') + ' F', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
                      { label: 'Commandes', value: employeeDetail.stats?.total_orders ?? 0, icon: ShoppingCart, color: 'bg-purple-50 text-purple-600' },
                      { label: 'Total dépensé', value: Math.round(employeeDetail.stats?.total_spent || 0).toLocaleString('fr-FR') + ' F', icon: CreditCard, color: 'bg-orange-50 text-orange-600' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center group hover:shadow-sm transition-shadow">
                        <div className={`w-8 h-8 ${s.color} rounded-lg flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform`}>
                          <s.icon className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
                        <p className="text-base font-bold text-gray-900 mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Tickets summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 font-medium">Tickets reçus</p>
                      <p className="text-lg font-extrabold text-gray-900">{employeeDetail.stats?.total_tickets_received ?? 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 font-medium">Tickets utilisés</p>
                      <p className="text-lg font-extrabold text-emerald-600">{employeeDetail.stats?.total_tickets_used ?? 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-400 font-medium">Tickets restants</p>
                      <p className="text-lg font-extrabold text-blue-600">{employeeDetail.stats?.total_tickets_remaining ?? 0}</p>
                    </div>
                  </div>

                  {/* Batches table */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-orange-500" />
                      Souches de tickets ({employeeDetail.batches?.length ?? 0})
                    </h4>
                    {employeeDetail.batches && employeeDetail.batches.length > 0 ? (
                      <div className="overflow-x-auto border border-gray-100 rounded-xl">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">N° Souche</th>
                              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Utilisés</th>
                              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Restants</th>
                              <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Val. unit.</th>
                              <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Montant</th>
                              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Validité</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeDetail.batches.map((batch: any, idx: number) => (
                              <tr key={idx} className={`border-b border-gray-50 ${batch.real_status === 'expired' ? 'bg-red-50/30' : 'hover:bg-orange-50/20'}`}>
                                <td className="px-3 py-2.5 text-xs font-mono text-gray-700">{batch.batch_number}</td>
                                <td className="px-3 py-2.5 text-xs text-center text-gray-900">{batch.total_tickets}</td>
                                <td className="px-3 py-2.5 text-xs text-center text-emerald-600 font-semibold">{batch.used_tickets}</td>
                                <td className="px-3 py-2.5 text-xs text-center font-semibold text-gray-900">{batch.remaining_tickets}</td>
                                <td className="px-3 py-2.5 text-xs text-right text-gray-600">{Math.round(batch.ticket_value).toLocaleString('fr-FR')} F</td>
                                <td className="px-3 py-2.5 text-xs text-right font-bold text-purple-600">
                                  {Math.round(batch.remaining_amount).toLocaleString('fr-FR')} F
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                                    batch.real_status === 'active'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-red-50 border-red-200 text-red-700'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${batch.real_status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                    {batch.real_status === 'active' ? 'Active' : 'Expirée'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <div className="text-xs text-gray-600">
                                    {batch.validity_end ? new Date(batch.validity_end).toLocaleDateString('fr-FR') : '-'}
                                  </div>
                                  {batch.real_status === 'active' && batch.days_left !== undefined && (
                                    <div className={`text-[10px] font-medium ${batch.days_left <= 7 ? 'text-amber-600' : 'text-gray-400'}`}>
                                      {batch.days_left}j restants
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <Ticket className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400 font-medium">Aucune souche de tickets</p>
                      </div>
                    )}
                  </div>

                  {/* Recent orders */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-orange-500" />
                      Dernières commandes ({employeeDetail.recent_orders?.length ?? 0})
                    </h4>
                    {employeeDetail.recent_orders && employeeDetail.recent_orders.length > 0 ? (
                      <div className="overflow-x-auto border border-gray-100 rounded-xl">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                              <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Montant</th>
                              <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Articles</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeDetail.recent_orders.map((order: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-50 hover:bg-orange-50/20">
                                <td className="px-3 py-2.5 text-xs text-gray-700">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </div>
                                  <div className="text-[10px] text-gray-400 ml-4">
                                    {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-xs text-right font-bold text-gray-900">
                                  {Math.round(order.total_amount).toLocaleString('fr-FR')} F
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                                    order.status === 'confirmed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                    order.status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                    'bg-red-50 border-red-200 text-red-700'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      order.status === 'confirmed' ? 'bg-emerald-400' :
                                      order.status === 'pending' ? 'bg-amber-400' : 'bg-red-400'
                                    }`}></span>
                                    {order.status === 'confirmed' ? 'Confirmée' :
                                     order.status === 'pending' ? 'En attente' : order.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[200px] truncate">
                                  {Array.isArray(order.items) ? order.items.map((item: any) => item.name || item.menu_item_name).join(', ') : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-400 font-medium">Aucune commande</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-5 border-t border-gray-100">
                  <button onClick={() => setShowDetailModal(false)}
                    className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Fermer
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Impossible de charger les détails</p>
                <button onClick={() => setShowDetailModal(false)}
                  className="mt-4 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
