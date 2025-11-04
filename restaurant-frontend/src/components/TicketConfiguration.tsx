import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  X,
  AlertTriangle,
  Save,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { apiService, type TicketConfiguration as TicketConfigurationType } from '../services/api';


interface TicketConfigurationForm {
  id?: string;
  ticket_value: number;
  validity_duration_days: number;
  type: 'standard' | 'premium' | 'bonus';
  auto_renewal: boolean;
  logo?: string;
}

const TicketConfiguration: React.FC = () => {
  const [configurations, setConfigurations] = useState<TicketConfigurationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<TicketConfigurationType | null>(null);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; title: string } | null>(null);

  const [formData, setFormData] = useState<TicketConfigurationForm>({
    ticket_value: 500,
    validity_duration_days: 30,
    type: 'standard',
    auto_renewal: false,
    logo: ''
  });
  
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Récupération des informations de l'utilisateur connecté
  const currentUser = {
    role: localStorage.getItem('userRole') || 'Utilisateur',
    companyId: localStorage.getItem('userCompanyId') || null,
    companyName: localStorage.getItem('userCompanyName') || ''
  };

  const isCompanyManager = currentUser.role === 'Gestionnaire Entreprise';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Charger les configurations de tickets depuis l'API
      const configData = await apiService.getTicketConfigurations();
      setConfigurations(configData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les configurations de tickets.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les configurations par entreprise
  const filteredConfigurations = isCompanyManager && currentUser.companyId
    ? configurations.filter(config => String(config.company_id) === String(currentUser.companyId))
    : configurations;

  const handleCreateConfig = () => {
    setSelectedConfig(null);
    setFormData({
      ticket_value: 500,
      validity_duration_days: 30,
      type: 'standard',
      auto_renewal: false,
      logo: ''
    });
    setLogoPreview('');
    setShowModal(true);
  };

  const handleEditConfig = (config: TicketConfigurationType) => {
    setSelectedConfig(config);
    setFormData({
      id: config.id,
      ticket_value: config.ticket_value,
      validity_duration_days: config.validity_duration_days,
      type: config.type,
      auto_renewal: config.auto_renewal,
      logo: config.logo || ''
    });
    setLogoPreview(config.logo || '');
    setShowModal(true);
  };

  const handleDeleteConfig = (configId: string) => {
    setConfigToDelete(configId);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedConfig) {
        // Mise à jour
        const updatedConfig = await apiService.updateTicketConfiguration(selectedConfig.id, formData);
        const updatedConfigs = configurations.map(config => 
          config.id === selectedConfig.id ? updatedConfig : config
        );
        setConfigurations(updatedConfigs);
        
        setNotification({
          type: 'success',
          title: 'Configuration mise à jour',
          message: 'La configuration des tickets a été mise à jour avec succès.'
        });
      } else {
        // Création
        const configData = {
          ...formData,
          company_id: currentUser.companyId || '1',
          is_active: true
        };
        const newConfig = await apiService.createTicketConfiguration(configData);
        setConfigurations([...configurations, newConfig]);
        
        setNotification({
          type: 'success',
          title: 'Configuration créée',
          message: 'La nouvelle configuration de tickets a été créée avec succès.'
        });
      }
      
      setShowModal(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Une erreur est survenue lors de la sauvegarde.'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (configToDelete) {
      try {
        await apiService.deleteTicketConfiguration(configToDelete);
        const updatedConfigs = configurations.filter(config => config.id !== configToDelete);
        setConfigurations(updatedConfigs);
        
        setNotification({
          type: 'info',
          title: 'Configuration supprimée',
          message: 'La configuration de tickets a été supprimée.'
        });
        setTimeout(() => setNotification(null), 4000);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        setNotification({
          type: 'error',
          title: 'Erreur de suppression',
          message: 'Une erreur est survenue lors de la suppression.'
        });
      }
    }
    setShowDeleteModal(false);
    setConfigToDelete(null);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'standard': return 'Standard';
      case 'premium': return 'Premium';
      case 'bonus': return 'Bonus';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'bonus': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setNotification({
          type: 'error',
          title: 'Fichier trop volumineux',
          message: 'Le logo ne doit pas dépasser 2 MB.'
        });
        return;
      }

      // Vérifier le type du fichier
      if (!file.type.startsWith('image/')) {
        setNotification({
          type: 'error',
          title: 'Format non supporté',
          message: 'Veuillez sélectionner une image (PNG, JPG, SVG).'
        });
        return;
      }

      // Convertir en base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, logo: base64String });
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo: '' });
    setLogoPreview('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des configurations...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration des Tickets</h1>
          <p className="text-gray-600">
            {isCompanyManager 
              ? `Paramétrez les tickets pour ${currentUser.companyName || 'votre entreprise'}`
              : 'Gérez les configurations de tickets pour toutes les entreprises'
            }
          </p>
        </div>
        <button
          onClick={handleCreateConfig}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle Configuration</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Configurations</p>
              <p className="text-2xl font-bold text-gray-900">{filteredConfigurations.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Valeur Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredConfigurations.length > 0 
                  ? Math.round(filteredConfigurations.reduce((sum, config) => sum + config.ticket_value, 0) / filteredConfigurations.length)
                  : 0
                }F
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Durée Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredConfigurations.length > 0 
                  ? Math.round(filteredConfigurations.reduce((sum, config) => sum + config.validity_duration_days, 0) / filteredConfigurations.length)
                  : 0
                } jours
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Auto-renouvellement</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredConfigurations.filter(config => config.auto_renewal).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des configurations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Configurations Actives</h2>
        </div>
        
        <div className="p-6">
          {filteredConfigurations.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune configuration</h3>
              <p className="text-gray-600 mb-6">Créez votre première configuration de tickets.</p>
              <button
                onClick={handleCreateConfig}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Créer une configuration
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredConfigurations.map((config) => (
                <div key={config.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-100 rounded-lg flex items-center justify-center">
                        {config.logo ? (
                          <img 
                            src={config.logo} 
                            alt="Logo" 
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          <CreditCard className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Ticket {getTypeLabel(config.type)}
                        </h3>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(config.type)}`}>
                          {getTypeLabel(config.type)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditConfig(config)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.id!)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Valeur du ticket</span>
                      <span className="font-semibold text-gray-900">{config.ticket_value}F</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Durée de validité</span>
                      <span className="font-semibold text-gray-900">{config.validity_duration_days} jours</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Auto-renouvellement</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        config.auto_renewal 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.auto_renewal ? 'Activé' : 'Désactivé'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedConfig ? 'Modifier la Configuration' : 'Nouvelle Configuration'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valeur du ticket */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur du ticket (F CFA) *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.ticket_value}
                      onChange={(e) => setFormData({ ...formData, ticket_value: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="500"
                      min="100"
                      step="50"
                      required
                    />
                  </div>
                </div>

                {/* Durée de validité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée de validité (jours) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.validity_duration_days}
                      onChange={(e) => setFormData({ ...formData, validity_duration_days: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="30"
                      min="1"
                      max="365"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Type de ticket */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de ticket *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'standard' | 'premium' | 'bonus' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="bonus">Bonus</option>
                </select>
              </div>

              {/* Logo du ticket */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo du ticket (optionnel)
                </label>
                <div className="space-y-3">
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                          </p>
                          <p className="text-xs text-gray-400">PNG, JPG, SVG (MAX. 2MB)</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleLogoUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-renouvellement */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="auto_renewal"
                  checked={formData.auto_renewal}
                  onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="auto_renewal" className="text-sm font-medium text-gray-700">
                  Activer le renouvellement automatique
                </label>
              </div>

              {/* Boutons d'action */}
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
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{selectedConfig ? 'Mettre à jour' : 'Créer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Supprimer la configuration
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Êtes-vous sûr de vouloir supprimer cette configuration de tickets ? 
              Cette action est <strong>irréversible</strong>.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfigToDelete(null);
                }}
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
    </div>
  );
};

export default TicketConfiguration;
