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
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h1>
          <p className="text-gray-600">Créez et gérez les comptes gestionnaires avec leurs assignations.</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Gestionnaire</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Utilisateurs</p>
            <p className="text-3xl font-bold text-gray-900">{users.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Utilisateurs Actifs</p>
            <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Gestionnaires Entreprise</p>
            <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role_name === 'Gestionnaire Entreprise').length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Utensils className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Gestionnaires Restaurant</p>
            <p className="text-3xl font-bold text-gray-900">{users.filter(u => u.role_name === 'Gestionnaire Restaurant').length}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Liste des Utilisateurs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignation
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.company_name && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Building2 className="w-3 h-3 mr-1" />
                        {user.company_name}
                      </span>
                    )}
                    {user.restaurant_name && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Utensils className="w-3 h-3 mr-1" />
                        {user.restaurant_name}
                      </span>
                    )}
                    {!user.company_name && !user.restaurant_name && (
                      <span className="text-gray-400 text-sm">Non assigné</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                       user.status === 'inactive' ? <Clock className="w-3 h-3 mr-1" /> :
                       <XCircle className="w-3 h-3 mr-1" />}
                      {user.status === 'active' ? 'Actif' :
                       user.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
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
                  {selectedUser ? 'Modifier l\'Utilisateur' : 'Nouveau Gestionnaire'}
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
                      placeholder="Ex: Ousmane Traoré"
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
                      placeholder="ousmane@restaurant.bf"
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
                      {selectedUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}
                    </label>
                    <input
                      type="password"
                      required={!selectedUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rôle *
                    </label>
                    <select
                      required
                      value={formData.role_id}
                      onChange={(e) => {
                        console.log('Changement de rôle:', e.target.value);
                        setFormData({ 
                          ...formData, 
                          role_id: e.target.value,
                          company_id: '',
                          restaurant_id: ''
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Entreprise assignée *
                          </label>
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
                        </div>
                      )}

                      {(formData.role_id === '3' || roles.find(r => r.id === formData.role_id)?.name === 'Gestionnaire Restaurant') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Restaurant assigné *
                          </label>
                          <select
                            required
                            value={formData.restaurant_id}
                            onChange={(e) => setFormData({ ...formData, restaurant_id: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
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

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {selectedUser ? 'Modifier' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Supprimer l'Utilisateur
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir supprimer l'utilisateur "{selectedUser.name}" ? 
                Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
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
