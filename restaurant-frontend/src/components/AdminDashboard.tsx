import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RoleManagement from './RoleManagement';
import CompanyManagement from './CompanyManagement';
import RestaurantManagement from './RestaurantManagement';
import UserManagement from './UserManagement';
import EmployeeManagement from './EmployeeManagement';
import TicketConfiguration from './TicketConfiguration';
import TicketBatchManagement from './TicketBatchManagement';
import UserTicketManagement from './UserTicketManagement';
import PartnerRestaurants from './PartnerRestaurants';
import CompanyReporting from './CompanyReporting';
import MenuManagement from './MenuManagement';
import WeeklyMenuPlanning from './WeeklyMenuPlanning';
import MyTickets from './MyTickets';
import MyHistory from './MyHistory';
import RestaurantOrderSystem from './RestaurantOrderSystem';
import OrderManagement from './OrderManagement';
import NotificationCenter from './NotificationCenter';
import { apiService, type Statistics } from '../services/api';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Utensils, 
  Ticket, 
  BarChart3, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  Package,
  Wallet,
  Store,
  ChefHat,
  Calendar,
  ShoppingCart
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupération des informations de l'utilisateur connecté
  const currentUser = {
    name: localStorage.getItem('userName') || 'Utilisateur',
    email: localStorage.getItem('userEmail') || 'email@example.com',
    role: localStorage.getItem('userRole') || 'Utilisateur',
    id: localStorage.getItem('userId') || '1'
  };

  // Fonction pour obtenir les initiales de l'utilisateur
  const getUserInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
  };

  // Fonction pour obtenir le nom du rôle en français
  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'Administrateur': 'Administrateur',
      'Gestionnaire Entreprise': 'Gestionnaire Entreprise',
      'Gestionnaire Restaurant': 'Gestionnaire Restaurant',
      'Utilisateur': 'Employé',
      'Gestionnaire Livraison': 'Gestionnaire Livraison'
    };
    return roleMap[role] || role;
  };

  // Définition de tous les menus possibles avec leurs permissions
  const allMenuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['Administrateur', 'Gestionnaire Entreprise', 'Gestionnaire Restaurant'] },
    { id: 'users', label: 'Gestionnaires', icon: Users, roles: ['Administrateur'] },
    { id: 'employees', label: 'Employés', icon: Users, roles: ['Administrateur', 'Gestionnaire Entreprise'] },
    { id: 'companies', label: 'Entreprises', icon: Building2, roles: ['Administrateur'] },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils, roles: ['Administrateur'] },
    { id: 'menu', label: 'Gestion du Menu', icon: ChefHat, roles: ['Gestionnaire Restaurant'] },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart, roles: ['Gestionnaire Restaurant'] },
    { id: 'weekly-planning', label: 'Planning Hebdo', icon: Calendar, roles: ['Gestionnaire Restaurant'] },
    { id: 'partner-restaurants', label: 'Restaurants Partenaires', icon: Store, roles: ['Gestionnaire Entreprise'] },
    { id: 'tickets', label: 'Configuration', icon: Settings, roles: ['Gestionnaire Entreprise'] },
    { id: 'batches', label: 'Souches', icon: Package, roles: ['Gestionnaire Entreprise'] },
    { id: 'user-tickets', label: 'Affecter Tickets', icon: Wallet, roles: ['Gestionnaire Entreprise'] },
    { id: 'reports', label: 'Rapports Dépenses', icon: BarChart3, roles: ['Gestionnaire Entreprise'] },
    { id: 'analytics', label: 'Analyses', icon: BarChart3, roles: ['Gestionnaire Entreprise', 'Gestionnaire Restaurant'] },
    { id: 'roles', label: 'Rôles', icon: Ticket, roles: ['Administrateur'] },
    
    // Menus pour les employés
    { id: 'my-tickets', label: 'Mes Tickets', icon: Wallet, roles: ['Utilisateur'] },
    { id: 'order-food', label: 'Commander', icon: Utensils, roles: ['Utilisateur'] },
    { id: 'my-history', label: 'Historique', icon: BarChart3, roles: ['Utilisateur'] },
  ];

  // Filtrer les menus selon le rôle de l'utilisateur connecté
  const menuItems = allMenuItems.filter(item => item.roles.includes(currentUser.role));

  // Synchroniser activeMenu avec l'URL lors de la navigation
  useEffect(() => {
    const path = location.pathname;
    // Extraire le menu depuis l'URL (ex: /admin/orders -> orders)
    const menuFromUrl = path.replace('/admin/', '').replace('/', '');
    
    // Si l'URL contient un menu valide, l'activer
    if (menuFromUrl && menuItems.some(item => item.id === menuFromUrl)) {
      setActiveMenu(menuFromUrl);
    }
  }, [location, menuItems]);

  // Charger les statistiques une seule fois au montage du composant
  useEffect(() => {
    loadStatistics();
  }, []);

  // Vérifier l'accès au menu séparément
  useEffect(() => {
    const hasAccessToCurrentMenu = menuItems.some(item => item.id === activeMenu);
    if (!hasAccessToCurrentMenu) {
      // Pour les employés (Utilisateur), démarrer sur "my-tickets", sinon "dashboard"
      const defaultMenu = currentUser.role === 'Utilisateur' ? 'my-tickets' : 'dashboard';
      setActiveMenu(defaultMenu);
    }
  }, [activeMenu, currentUser.role]); // Dépendre du rôle plutôt que de menuItems

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 h-screen bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AT</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AppTicket</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id);
                  navigate(`/admin/${item.id}`);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">{getUserInitials(currentUser.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{getRoleDisplayName(currentUser.role)}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full mt-2 flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Système de notifications */}
              <NotificationCenter />
              
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs">{getUserInitials(currentUser.name)}</span>
                  </div>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 bg-gray-50">
          {activeMenu === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                  <p className="text-gray-600">Vue d'ensemble de votre plateforme AppTicket</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={loadStatistics}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <span className="text-lg">🔄</span>
                    <span>Actualiser</span>
                  </button>
                  <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    Exporter Données
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="ml-2 text-gray-600">Chargement des statistiques...</span>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Utilisateurs */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden">
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-blue-100 text-sm font-medium">Total Utilisateurs</p>
                        <p className="text-4xl font-bold">{statistics?.overview.total_users || 0}</p>
                      </div>
                      <div className="flex items-center text-blue-100 text-sm">
                        <span className="bg-white/20 px-2 py-1 rounded text-xs mr-2">
                          {statistics?.overview.active_users || 0} actifs
                        </span>
                      </div>
                    </div>

                    {/* Total Entreprises */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden">
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <Building2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-orange-100 text-sm font-medium">Total Entreprises</p>
                        <p className="text-4xl font-bold">{statistics?.overview.total_companies || 0}</p>
                      </div>
                      <div className="flex items-center text-orange-100 text-sm">
                        <span className="bg-white/20 px-2 py-1 rounded text-xs mr-2">
                          {statistics?.overview.active_companies || 0} actives
                        </span>
                      </div>
                    </div>

                    {/* Total Restaurants */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <Utensils className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs">🍽️</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Restaurants</p>
                        <p className="text-3xl font-bold text-gray-900 mb-2">{statistics?.overview.total_restaurants || 0}</p>
                        <div className="flex items-center text-sm">
                          <span className="text-green-600 font-medium">{statistics?.overview.active_restaurants || 0} actifs</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Tickets */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Ticket className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs">🎫</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">Total Tickets</p>
                        <p className="text-3xl font-bold text-gray-900 mb-2">{statistics?.overview.total_ticket_balance?.toLocaleString() || 0}</p>
                        <div className="flex items-center text-sm">
                          <span className="text-blue-600 font-medium">{statistics?.overview.total_employees || 0} employés</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts and Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Users by Role */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilisateurs par Rôle</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Administrateurs</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{statistics?.users_by_role.administrators || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Gestionnaires</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{statistics?.users_by_role.managers || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Employés</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{statistics?.users_by_role.employees || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Companies Stats */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Entreprises</h3>
                      <div className="space-y-3">
                        {statistics?.companies_stats.map((company, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{company.company_name}</p>
                              <p className="text-sm text-gray-600">{company.employee_count} employés</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-orange-600">{company.total_tickets} tickets</p>
                              <p className="text-xs text-green-600">{company.active_employees} actifs</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Department Stats */}
                  {statistics?.department_stats && statistics.department_stats.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Départements</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {statistics.department_stats.map((dept, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">{dept.department}</h4>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Employés:</span>
                                <span className="font-medium">{dept.employee_count}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tickets:</span>
                                <span className="font-medium text-orange-600">{dept.total_tickets}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeMenu === 'roles' && (
            <RoleManagement />
          )}

          {activeMenu === 'companies' && (
            <CompanyManagement />
          )}

          {activeMenu === 'restaurants' && (
            <RestaurantManagement />
          )}

          {activeMenu === 'menu' && (
            <MenuManagement />
          )}

          {activeMenu === 'orders' && (
            <OrderManagement />
          )}

          {activeMenu === 'weekly-planning' && (
            <WeeklyMenuPlanning />
          )}

          {activeMenu === 'users' && (
            <UserManagement />
          )}

          {activeMenu === 'employees' && (
            <EmployeeManagement />
          )}

          {activeMenu === 'tickets' && (
            <TicketConfiguration />
          )}

          {activeMenu === 'batches' && (
            <TicketBatchManagement />
          )}

          {activeMenu === 'user-tickets' && (
            <UserTicketManagement />
          )}

          {activeMenu === 'partner-restaurants' && (
            <PartnerRestaurants />
          )}

          {activeMenu === 'reports' && (
            <CompanyReporting />
          )}

          {activeMenu === 'analytics' && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Analyses Avancées</h3>
              <p className="text-gray-500">Cette section sera bientôt disponible</p>
            </div>
          )}

          {activeMenu === 'my-tickets' && (
            <MyTickets />
          )}

          {activeMenu === 'order-food' && (
            <RestaurantOrderSystem />
          )}

          {activeMenu === 'my-history' && (
            <MyHistory />
          )}
        </main>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
