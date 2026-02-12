import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Building2,
  Utensils,
  Shield,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle,
  CalendarDays
} from 'lucide-react';
import { apiService, type User, type Role, type Company, type Restaurant } from '../services/api';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role_id: '',
    company_id: '',
    restaurant_id: '',
    status: 'active' as 'active' | 'inactive' | 'suspended'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Charger toutes les données nécessaires
      const [usersData, rolesData, companiesData, restaurantsData] = await Promise.all([
        apiService.getUsers().catch(() => []),
        apiService.getRoles().catch(() => []),
        apiService.getCompanies().catch(() => []),
        apiService.getRestaurants().catch(() => [])
      ]);
      
      setUsers(usersData);
      setRoles(rolesData);
      setCompanies(companiesData);
      setRestaurants(restaurantsData);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Error loading data:', err);
      // Fallback avec des données par défaut
      setUsers([
        {
          id: '1',
          name: 'Ousmane Traoré',
          email: 'ousmane@chezaminata.bf',
          phone: '+226 70 12 34 56',
          role_id: '3',
          role_name: 'Gestionnaire Restaurant',
          restaurant_id: '1',
          restaurant_name: 'Chez Aminata',
          status: 'active',
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: '2',
          name: 'Fatimata Sawadogo',
          email: 'fatimata@techcorp.bf',
          phone: '+226 25 30 45 67',
          role_id: '2',
          role_name: 'Gestionnaire Entreprise',
          company_id: '1',
          company_name: 'TechCorp Burkina',
          status: 'active',
          created_at: '2024-01-10',
          updated_at: '2024-01-10'
        }
      ]);
      setRoles([
        { 
          id: '1', 
          name: 'Administrateur', 
          description: 'Administrateur système', 
          is_system: true, 
          permissions: [],
          user_count: 1,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        { 
          id: '2', 
          name: 'Gestionnaire Entreprise', 
          description: 'Gestionnaire d\'entreprise', 
          is_system: false, 
          permissions: [],
          user_count: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        { 
          id: '3', 
          name: 'Gestionnaire Restaurant', 
          description: 'Gestionnaire de restaurant', 
          is_system: false, 
          permissions: [],
          user_count: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        { 
          id: '4', 
          name: 'Utilisateur', 
          description: 'Employé d\'entreprise', 
          is_system: false, 
          permissions: [],
          user_count: 0,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]);
      
      // Forcer l'ajout des données de test pour les entreprises et restaurants
      console.log('Chargement des données de test - companies:', companies.length, 'restaurants:', restaurants.length);
      
      setCompanies([
        {
          id: '1',
          name: 'TechCorp Burkina',
          email: 'contact@techcorp.bf',
          phone: '+226 25 30 45 67',
          address: 'Zone industrielle, Ouagadougou',
          city: 'Ouagadougou',
          postal_code: '01000',
          country: 'Burkina Faso',
          employee_count: 50,
          ticket_balance: 100000,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: '2',
          name: 'Burkina Innovation SARL',
          email: 'contact@burkinainnovation.bf',
          phone: '+226 70 11 22 33',
          address: 'Avenue Charles de Gaulle',
          city: 'Ouagadougou',
          postal_code: '01 BP 5678',
          country: 'Burkina Faso',
          employee_count: 25,
          ticket_balance: 50000,
          status: 'active',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]);
      
      setRestaurants([
        {
          id: '1',
          name: 'Chez Aminata',
          email: 'contact@chezaminata.bf',
          phone: '+226 25 30 45 67',
          address: 'Avenue Kwame Nkrumah, Secteur 4',
          city: 'Ouagadougou',
          postal_code: '01 BP 1234',
          country: 'Burkina Faso',
          cuisine_type: 'Burkinabé, Africaine',
          description: 'Restaurant traditionnel burkinabé',
          website: 'https://chezaminata.bf',
          opening_hours: '11h00 - 23h00',
          delivery_fee: 1000,
          minimum_order: 3000,
          average_rating: 4.5,
          total_reviews: 127,
          status: 'active',
          is_partner: true,
          commission_rate: 15,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: '2',
          name: 'Le Sahel Gourmand',
          email: 'contact@sahel.bf',
          phone: '+226 70 98 76 54',
          address: 'Rue de la Paix, Secteur 12',
          city: 'Bobo-Dioulasso',
          postal_code: '01 BP 9876',
          country: 'Burkina Faso',
          cuisine_type: 'Burkinabé, Grillades',
          description: 'Restaurant spécialisé dans les grillades burkinabé',
          website: 'https://sahel.bf',
          opening_hours: '12h00 - 00h00',
          delivery_fee: 1200,
          minimum_order: 3500,
          average_rating: 4.2,
          total_reviews: 89,
          status: 'active',
          is_partner: true,
          commission_rate: 15,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role_id: '',
      company_id: '',
      restaurant_id: '',
      status: 'active'
    });
    
    // Forcer le rechargement des données au moment de l'ouverture du modal
    console.log('Ouverture du modal - Rechargement des données...');
    console.log('Données actuelles:', { 
      companies: companies.length, 
      restaurants: restaurants.length, 
      roles: roles.length 
    });
    
    // Recharger les données si elles sont vides
    if (companies.length === 0 || restaurants.length === 0) {
      loadData();
    }
    
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role_id: user.role_id,
      company_id: user.company_id || '',
      restaurant_id: user.restaurant_id || '',
      status: user.status
    });
    setShowModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedUser) {
        // Modifier un utilisateur existant via l'API
        const updatedUser = await apiService.updateUser(selectedUser.id, formData);
        setUsers(users.map(user => 
          user.id === selectedUser.id ? updatedUser : user
        ));
      } else {
        // Créer un nouvel utilisateur via l'API
        const newUser = await apiService.createUser(formData);
        setUsers([...users, newUser]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // En cas d'erreur API, utiliser la logique locale comme fallback
      const selectedRole = roles.find(r => r.id === formData.role_id);
      const selectedCompany = companies.find(c => c.id === formData.company_id);
      const selectedRestaurant = restaurants.find(r => r.id === formData.restaurant_id);
      
      if (selectedUser) {
        // Modifier un utilisateur existant (fallback local)
        setUsers(users.map(user => 
          user.id === selectedUser.id 
            ? { 
                ...user, 
                ...formData, 
                role_name: selectedRole?.name || user.role_name,
                company_name: selectedCompany?.name || undefined,
                restaurant_name: selectedRestaurant?.name || undefined,
                updated_at: new Date().toISOString().split('T')[0] 
              }
            : user
        ));
      } else {
        // Créer un nouvel utilisateur (fallback local)
        const newUser: User = {
          id: Date.now().toString(),
          ...formData,
          role_name: selectedRole?.name || 'Non défini',
          company_name: selectedCompany?.name || undefined,
          restaurant_name: selectedRestaurant?.name || undefined,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0]
        };
        setUsers([...users, newUser]);
      }
      setShowModal(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedUser) {
      try {
        // Supprimer via l'API
        await apiService.deleteUser(selectedUser.id);
        setUsers(users.filter(user => user.id !== selectedUser.id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        // En cas d'erreur API, supprimer localement comme fallback
        setUsers(users.filter(user => user.id !== selectedUser.id));
      }
    }
    setShowDeleteModal(false);
    setSelectedUser(null);
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
          <p className="text-gray-500 font-medium">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-sm text-gray-400 mt-0.5">Créez et gérez les comptes gestionnaires avec leurs assignations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{dateStr}</span>
          </div>
          <button
            onClick={handleCreateUser}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100"
          >
            <Plus className="w-4 h-4" />
            Nouveau Gestionnaire
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Utilisateurs', value: users.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Utilisateurs Actifs', value: users.filter(u => u.status === 'active').length, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Gest. Entreprise', value: users.filter(u => u.role_name === 'Gestionnaire Entreprise').length, icon: Building2, color: 'bg-purple-50 text-purple-600' },
          { label: 'Gest. Restaurant', value: users.filter(u => u.role_name === 'Gestionnaire Restaurant').length, icon: Utensils, color: 'bg-orange-50 text-orange-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${s.color} group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Liste des Utilisateurs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Utilisateur</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rôle</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Assignation</th>
                <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Aucun utilisateur trouvé</p>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.id} className={`hover:bg-orange-50/30 transition-colors ${idx !== users.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-orange-600">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-purple-50 border-purple-200 text-purple-700">
                        <Shield className="w-3 h-3" />
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {user.company_name && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-blue-50 border-blue-200 text-blue-700">
                          <Building2 className="w-3 h-3" />
                          {user.company_name}
                        </span>
                      )}
                      {user.restaurant_name && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-orange-50 border-orange-200 text-orange-700">
                          <Utensils className="w-3 h-3" />
                          {user.restaurant_name}
                        </span>
                      )}
                      {!user.company_name && !user.restaurant_name && (
                        <span className="text-xs text-gray-300 font-medium">Non assigné</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        user.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        user.status === 'inactive' ? 'bg-gray-50 border-gray-200 text-gray-600' :
                        'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'active' ? 'bg-emerald-400' :
                          user.status === 'inactive' ? 'bg-gray-400' : 'bg-red-400'
                        }`}></span>
                        {user.status === 'active' ? 'Actif' :
                         user.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 transition-colors"
                        >
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
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {selectedUser ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedUser ? 'Modifier l\'Utilisateur' : 'Nouveau Gestionnaire'}</h2>
                  <p className="text-sm text-orange-100">Remplissez les informations du compte</p>
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
                    placeholder="Ex: Ousmane Traoré" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="ousmane@restaurant.bf" />
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
                    {selectedUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}
                  </label>
                  <input type="password" required={!selectedUser} value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rôle *</label>
                  <select required value={formData.role_id}
                    onChange={(e) => {
                      console.log('Changement de rôle:', e.target.value);
                      setFormData({ ...formData, role_id: e.target.value, company_id: '', restaurant_id: '' });
                    }}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300">
                    <option value="">Sélectionner un rôle</option>
                    {(() => {
                      console.log('Rôles disponibles dans le dropdown:', roles);
                      return roles.filter(role => role.name !== 'Administrateur').map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ));
                    })()}
                  </select>
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

                {/* Assignation conditionnelle */}
                {formData.role_id && (
                  <div className="md:col-span-2">
                    {(() => {
                      const selectedRole = roles.find(r => r.id === formData.role_id);
                      console.log('=== DEBUG ASSIGNATION ===');
                      console.log('formData.role_id:', formData.role_id);
                      console.log('Tous les rôles disponibles:', roles.map(r => ({ id: r.id, name: r.name })));
                      console.log('Rôle sélectionné:', selectedRole);
                      console.log('Nom du rôle sélectionné:', `"${selectedRole?.name}"`);
                      console.log('Test Gestionnaire Entreprise:', selectedRole?.name === 'Gestionnaire Entreprise');
                      console.log('Test Gestionnaire Restaurant:', selectedRole?.name === 'Gestionnaire Restaurant');
                      console.log('Données disponibles:', { companies: companies.length, restaurants: restaurants.length });
                      console.log('========================');
                      return null;
                    })()}
                    
                    {(formData.role_id === '2' || roles.find(r => r.id === formData.role_id)?.name === 'Gestionnaire Entreprise') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Entreprise assignée *</label>
                        <select required value={formData.company_id}
                          onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300">
                          <option value="">Sélectionner une entreprise</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(formData.role_id === '3' || roles.find(r => r.id === formData.role_id)?.name === 'Gestionnaire Restaurant') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Restaurant assigné *</label>
                        <select required value={formData.restaurant_id}
                          onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300">
                          <option value="">Sélectionner un restaurant</option>
                          {restaurants.map((restaurant) => (
                            <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                  {selectedUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Supprimer l'Utilisateur</h3>
                  <p className="text-sm text-red-100">Cette action est irréversible</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-5">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="font-semibold text-gray-900">"{selectedUser.name}"</span> ? 
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
    </div>
  );
};

export default UserManagement;
