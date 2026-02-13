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
import RestaurantReporting from './RestaurantReporting';
import AccountingReport from './AccountingReport';
import MenuManagement from './MenuManagement';
import WeeklyMenuPlanning from './WeeklyMenuPlanning';
import DeliveryLocationManagement from './DeliveryLocationManagement';
import MyTickets from './MyTickets';
import MyHistory from './MyHistory';
import RestaurantOrderSystem from './RestaurantOrderSystem';
import OrderManagement from './OrderManagement';
import NotificationCenter from './NotificationCenter';
import DashboardStats from './DashboardStats';
import TicketAnalytics from './TicketAnalytics';
import AdvertisementManagement from './AdvertisementManagement';
import AdSlider from './AdSlider';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Utensils, 
  Ticket, 
  BarChart3, 
  Settings, 
  LogOut,
  Search,
  Menu,
  X,
  Package,
  Wallet,
  Store,
  ChefHat,
  Calendar,
  ShoppingCart,
  MapPin,
  FileSpreadsheet,
  Megaphone
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

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
    { id: 'roles', label: 'Rôles', icon: Ticket, roles: ['Administrateur'] },
    { id: 'users', label: 'Gestionnaires', icon: Users, roles: ['Administrateur'] },
    { id: 'companies', label: 'Entreprises', icon: Building2, roles: ['Administrateur'] },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils, roles: ['Administrateur'] },
    { id: 'employees', label: 'Employés', icon: Users, roles: ['Administrateur', 'Gestionnaire Entreprise'] },
    { id: 'advertisements', label: 'Publicités', icon: Megaphone, roles: ['Administrateur'] },
    { id: 'user-tickets', label: 'Affecter Tickets', icon: Wallet, roles: ['Gestionnaire Entreprise'] },
    { id: 'tickets', label: 'Configurations Tickets', icon: Settings, roles: ['Gestionnaire Entreprise'] },
    { id: 'batches', label: 'Souches', icon: Package, roles: ['Gestionnaire Entreprise'] },
    { id: 'delivery-locations', label: 'Lieux de Livraison', icon: MapPin, roles: ['Gestionnaire Entreprise'] },
    { id: 'partner-restaurants', label: 'Restaurants Partenaires', icon: Store, roles: ['Gestionnaire Entreprise'] },
    { id: 'reports', label: 'Rapports Dépenses', icon: BarChart3, roles: ['Gestionnaire Entreprise'] },
    { id: 'analytics', label: 'Analyses', icon: BarChart3, roles: ['Gestionnaire Entreprise'] },
    { id: 'accounting-report', label: 'Rapport Comptable', icon: FileSpreadsheet, roles: ['Administrateur', 'Gestionnaire Entreprise'] },
    { id: 'menu', label: 'Gestion du Menu', icon: ChefHat, roles: ['Gestionnaire Restaurant'] },
    { id: 'weekly-planning', label: 'Planning Hebdo', icon: Calendar, roles: ['Gestionnaire Restaurant'] },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart, roles: ['Gestionnaire Restaurant'] },
    { id: 'restaurant-reports', label: 'Rapports Commandes', icon: BarChart3, roles: ['Gestionnaire Restaurant'] },
    
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

  // Vérifier l'accès au menu séparément
  useEffect(() => {
    const hasAccessToCurrentMenu = menuItems.some(item => item.id === activeMenu);
    if (!hasAccessToCurrentMenu) {
      // Pour les employés (Utilisateur), démarrer sur "my-tickets", sinon "dashboard"
      const defaultMenu = currentUser.role === 'Utilisateur' ? 'my-tickets' : 'dashboard';
      setActiveMenu(defaultMenu);
    }
  }, [activeMenu, currentUser.role]); // Dépendre du rôle plutôt que de menuItems

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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Rechercher une page..."
                  className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {searchFocused && searchTerm.trim().length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-72 overflow-y-auto">
                    {menuItems.filter(item =>
                      item.label.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length > 0 ? (
                      menuItems.filter(item =>
                        item.label.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((item) => {
                        const Icon = item.icon;
                        const isActive = activeMenu === item.id;
                        return (
                          <button
                            key={item.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setActiveMenu(item.id);
                              navigate(`/admin/${item.id}`);
                              setSearchTerm('');
                              setSearchFocused(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                              isActive ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                            <span className="text-sm font-medium">{item.label}</span>
                            {isActive && <span className="ml-auto text-[10px] font-bold text-orange-400 uppercase">Actif</span>}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Aucun résultat pour « {searchTerm} »</p>
                      </div>
                    )}
                  </div>
                )}
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
            <DashboardStats />
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

          {activeMenu === 'restaurant-reports' && (
            <RestaurantReporting />
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

          {activeMenu === 'accounting-report' && (
            <AccountingReport />
          )}

          {activeMenu === 'delivery-locations' && (
            <DeliveryLocationManagement />
          )}

          {activeMenu === 'analytics' && (
            <TicketAnalytics />
          )}

          {activeMenu === 'advertisements' && (
            <AdvertisementManagement />
          )}

          {activeMenu === 'my-tickets' && (
            <>
              <AdSlider />
              <div className="mt-6">
                <MyTickets />
              </div>
            </>
          )}

          {activeMenu === 'order-food' && (
            <>
              <AdSlider />
              <div className="mt-6">
                <RestaurantOrderSystem />
              </div>
            </>
          )}

          {activeMenu === 'my-history' && (
            <>
              <AdSlider />
              <div className="mt-6">
                <MyHistory />
              </div>
            </>
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
