import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  AlertTriangle,
  CalendarDays,
  Calendar,
  X,
  Tag,
  FileText,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { apiService, type Role } from '../services/api';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Chargement des rôles...');
      
      const rolesData = await apiService.getRoles();
      console.log('Rôles reçus:', rolesData);
      
      setRoles(rolesData);
    } catch (err) {
      console.error('Erreur lors du chargement des rôles:', err);
      setError('Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedRole) {
        // Modification
        const updatedRole = await apiService.updateRole(selectedRole.id.toString(), formData);
        setRoles(roles.map(role => role.id === selectedRole.id ? updatedRole : role));
      } else {
        // Création
        const newRole = await apiService.createRole(formData);
        setRoles([...roles, newRole]);
      }
      
      setShowModal(false);
      setSelectedRole(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du rôle');
    }
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = (role: Role) => {
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete) {
      try {
        await apiService.deleteRole(roleToDelete.id.toString());
        setRoles(roles.filter(r => r.id !== roleToDelete.id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
    setShowDeleteModal(false);
    setRoleToDelete(null);
  };

  const openCreateModal = () => {
    setSelectedRole(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
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
          <p className="text-gray-500 font-medium">Chargement des rôles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm text-red-700 font-medium mb-4">{error}</p>
        <button onClick={loadRoles}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Rôles</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez les rôles et leurs permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{dateStr}</span>
          </div>
          <button onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100">
            <Plus className="w-4 h-4" />
            Nouveau Rôle
          </button>
        </div>
      </div>

      {/* Roles Grid */}
      {roles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Aucun rôle</h3>
          <p className="text-sm text-gray-400 mb-5">Créez votre premier rôle pour organiser les permissions</p>
          <button onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-orange-100">
            <Plus className="w-4 h-4" />
            Créer un rôle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{role.name}</h3>
                    <p className="text-[10px] text-gray-400 font-medium">ID: {role.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(role)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(role)}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4 line-clamp-2">{role.description}</p>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold">{role.user_count}</span>
                  <span>utilisateur{role.user_count !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>Créé le {new Date(role.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            {/* Header avec gradient subtil */}
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                    {selectedRole ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Définissez le nom et la description du rôle</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pt-6 pb-6 space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Tag className="w-3.5 h-3.5 text-orange-500" />
                  Nom du rôle <span className="text-red-400">*</span>
                </label>
                <input type="text" value={formData.name} required
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                  placeholder="Ex: Gestionnaire" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  Description
                </label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 resize-none"
                  placeholder="Décrivez les responsabilités de ce rôle..." rows={3} />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedRole ? 'Enregistrer' : 'Créer le rôle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && roleToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => { setShowDeleteModal(false); setRoleToDelete(null); }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-rose-50 to-red-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                    <ShieldAlert className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Supprimer le Rôle</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible</p>
                  </div>
                </div>
                <button onClick={() => { setShowDeleteModal(false); setRoleToDelete(null); }}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 pt-6 pb-6">
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir supprimer le rôle <span className="font-bold text-gray-900">"{roleToDelete.name}"</span> ?
                </p>
                {roleToDelete.user_count > 0 && (
                  <div className="flex items-start gap-2 mt-3 bg-red-100/50 rounded-lg p-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-semibold">
                      {roleToDelete.user_count} utilisateur{roleToDelete.user_count !== 1 ? 's' : ''} associé{roleToDelete.user_count !== 1 ? 's' : ''} à ce rôle.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteModal(false); setRoleToDelete(null); }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Annuler
                </button>
                <button onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
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
