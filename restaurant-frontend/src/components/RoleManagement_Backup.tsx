import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Settings, 
  Eye,
  X,
  AlertTriangle
} from 'lucide-react';
import { apiService, type Role, type Permission } from '../services/api';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Chargement des rôles et permissions...');
        
        const [rolesData, permissionsData] = await Promise.all([
          apiService.getRoles(),
          apiService.getPermissions()
        ]);
        
        console.log('Rôles reçus:', rolesData);
        console.log('Permissions reçues:', permissionsData);
        
        setRoles(rolesData);
        setPermissions(permissionsData);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Erreur lors du chargement des données');
        
        // Fallback avec des données par défaut
        setRoles([
          {
            id: 1,
            name: 'Administrateur',
            description: 'Administrateur système avec tous les droits',
            permissions: ['all'],
            user_count: 1,
            created_at: '2024-01-15',
            updated_at: '2024-01-15',
            is_system: true
          },
          {
            id: 2,
            name: 'Gestionnaire Entreprise',
            description: 'Gestionnaire d\'entreprise - gestion des employés et tickets',
            permissions: ['manage_employees', 'manage_tickets', 'view_reports'],
            user_count: 45,
            created_at: '2024-01-15',
            is_system: true
          },
          {
            id: '3',
            name: 'Gestionnaire Restaurant',
            description: 'Gestionnaire de restaurant - gestion des menus et commandes',
            permissions: ['manage_menu', 'manage_orders', 'view_analytics'],
            user_count: 23,
            created_at: '2024-01-15',
            is_system: true
          },
          {
            id: '4',
            name: 'Utilisateur',
            description: 'Employé d\'entreprise - peut passer des commandes',
            permissions: ['place_orders', 'view_profile'],
            user_count: 2847,
            created_at: '2024-01-15',
            is_system: true
          },
          {
            id: '5',
            name: 'Gestionnaire Livraison',
            description: 'Gestionnaire de société de livraison',
            permissions: ['manage_deliveries', 'update_status'],
            user_count: 12,
            created_at: '2024-02-10',
            is_system: false
          }
        ]);
        setPermissions([
          { id: 'all', name: 'Tous les droits', description: 'Accès administrateur complet', category: 'Système' },
          { id: 'manage_employees', name: 'Gérer les employés', description: 'Créer, modifier, supprimer des employés', category: 'Entreprise' },
          { id: 'manage_tickets', name: 'Gérer les tickets', description: 'Acheter et distribuer des tickets', category: 'Entreprise' },
          { id: 'view_reports', name: 'Voir les rapports', description: 'Accès aux rapports et statistiques', category: 'Entreprise' },
          { id: 'manage_menu', name: 'Gérer le menu', description: 'Créer et modifier les plats du menu', category: 'Restaurant' },
          { id: 'manage_orders', name: 'Gérer les commandes', description: 'Traiter et valider les commandes', category: 'Restaurant' },
          { id: 'view_analytics', name: 'Voir les analyses', description: 'Accès aux analyses de performance', category: 'Restaurant' },
          { id: 'place_orders', name: 'Passer des commandes', description: 'Commander des repas avec des tickets', category: 'Utilisateur' },
          { id: 'view_profile', name: 'Voir le profil', description: 'Consulter et modifier son profil', category: 'Utilisateur' },
          { id: 'manage_deliveries', name: 'Gérer les livraisons', description: 'Prendre en charge les livraisons', category: 'Livraison' },
          { id: 'update_status', name: 'Mettre à jour le statut', description: 'Modifier le statut des livraisons', category: 'Livraison' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const handleCreateRole = () => {
    setSelectedRole(null);
    setFormData({ name: '', description: '', permissions: [] });
    setShowModal(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    setShowModal(true);
  };

  const handleDeleteRole = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const handleSaveRole = () => {
    if (selectedRole) {
      // Modifier un rôle existant
      setRoles(roles.map(role => 
        role.id === selectedRole.id 
          ? { ...role, ...formData }
          : role
      ));
    } else {
      // Créer un nouveau rôle
      const newRole: Role = {
        id: Date.now().toString(),
        ...formData,
        user_count: 0,
        created_at: new Date().toISOString().split('T')[0],
        is_system: false
      };
      setRoles([...roles, newRole]);
    }
    setShowModal(false);
  };

  const handleConfirmDelete = () => {
    if (selectedRole) {
      setRoles(roles.filter(role => role.id !== selectedRole.id));
    }
    setShowDeleteModal(false);
  };

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: Permission[] } = {};
    permissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = [];
      }
      categories[permission.category].push(permission);
    });
    return categories;
  };

  const getRoleColor = (role: Role) => {
    if (role.name === 'Administrateur') return 'bg-red-100 text-red-800';
    if (role.name.includes('Gestionnaire')) return 'bg-blue-100 text-blue-800';
    if (role.name === 'Utilisateur/Employé') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rôles...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Rôles</h1>
          <p className="text-gray-600">Créez, modifiez et gérez les rôles et permissions du système.</p>
        </div>
        <button
          onClick={handleCreateRole}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau Rôle</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Rôles</p>
            <p className="text-3xl font-bold text-gray-900">{roles.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Utilisateurs Assignés</p>
            <p className="text-3xl font-bold text-gray-900">{roles.reduce((sum, role) => sum + role.user_count, 0)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Permissions</p>
            <p className="text-3xl font-bold text-gray-900">{permissions.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Rôles Système</p>
            <p className="text-3xl font-bold text-gray-900">{roles.filter(role => role.is_system).length}</p>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Liste des Rôles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateurs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">{role.name}</div>
                          {role.is_system && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Système
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{role.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <span key={permission} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
                          {permissions.find(p => p.id === permission)?.name || permission}
                        </span>
                      ))}
                      {role.permissions.length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{role.permissions.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {role.user_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(role.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {!role.is_system && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRole ? 'Modifier le Rôle' : 'Créer un Nouveau Rôle'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du Rôle
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ex: Gestionnaire de Livraison"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Décrivez les responsabilités de ce rôle..."
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Permissions
                </label>
                <div className="space-y-4">
                  {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                      <div className="space-y-2">
                        {categoryPermissions.map((permission) => (
                          <label key={permission.id} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => handlePermissionToggle(permission.id)}
                              className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                              <div className="text-xs text-gray-500">{permission.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRole}
                disabled={!formData.name.trim() || !formData.description.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selectedRole ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Supprimer le Rôle
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir supprimer le rôle "{selectedRole.name}" ? 
                Cette action est irréversible et affectera {selectedRole.user_count} utilisateur(s).
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

export default RoleManagement;
