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
  Upload,
  CheckCircle2,
  ShieldAlert,
  Tag,
  Image,
  RefreshCw
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
      ticket_value: parseFloat(String(config.ticket_value)),
      validity_duration_days: config.validity_days || 30,
      type: (config as any).type || 'standard',
      auto_renewal: (config as any).auto_renewal || false,
      logo: (config as any).logo || ''
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
        const updatedConfig = await apiService.updateTicketConfiguration(selectedConfig.id, formData as any);
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
        const newConfig = await apiService.createTicketConfiguration(configData as any);
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement des configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md w-full rounded-2xl shadow-lg border p-4 backdrop-blur-sm ${
          notification.type === 'success' ? 'bg-emerald-50/95 border-emerald-200' :
          notification.type === 'error' ? 'bg-red-50/95 border-red-200' : 'bg-blue-50/95 border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-1.5 rounded-lg flex-shrink-0 ${
              notification.type === 'success' ? 'bg-emerald-100' :
              notification.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : notification.type === 'error' ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold ${
                notification.type === 'success' ? 'text-emerald-800' :
                notification.type === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>{notification.title}</p>
              <p className={`text-xs mt-0.5 ${
                notification.type === 'success' ? 'text-emerald-600' :
                notification.type === 'error' ? 'text-red-600' : 'text-blue-600'
              }`}>{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 p-1 hover:bg-white/50 rounded-lg"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration des Tickets</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isCompanyManager 
              ? `Paramétrez les tickets pour ${currentUser.companyName || 'votre entreprise'}`
              : 'Gérez les configurations de tickets pour toutes les entreprises'
            }
          </p>
        </div>
        <button
          onClick={handleCreateConfig}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-orange-100"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Configuration</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Configurations</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{filteredConfigurations.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Valeur Moyenne</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {filteredConfigurations.length > 0 
                  ? Math.round(filteredConfigurations.reduce((sum, config) => sum + parseFloat(String(config.ticket_value)), 0) / filteredConfigurations.length)
                  : 0
                }F
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Durée Moyenne</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {filteredConfigurations.length > 0 
                  ? Math.round(filteredConfigurations.reduce((sum, config) => sum + (config.validity_days || 0), 0) / filteredConfigurations.length)
                  : 0
                }<span className="text-lg font-bold text-gray-400 ml-1">j</span>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Auto-renouvellement</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {filteredConfigurations.filter(config => config.auto_renewal).length}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des configurations */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Configurations Actives</h2>

        {filteredConfigurations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Aucune configuration</h3>
            <p className="text-sm text-gray-400 mb-6">Créez votre première configuration de tickets</p>
            <button
              onClick={handleCreateConfig}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              Créer une configuration
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredConfigurations.map((config) => (
              <div key={config.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-50 rounded-xl flex items-center justify-center">
                      {config.logo ? (
                        <img 
                          src={config.logo} 
                          alt="Logo" 
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <CreditCard className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">
                        Ticket {getTypeLabel(config.type || 'standard')}
                      </h3>
                      <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${getTypeColor(config.type || 'standard')}`}>
                        {getTypeLabel(config.type || 'standard')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditConfig(config)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config.id!)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-xs text-gray-500">Valeur du ticket</span>
                    <span className="text-sm font-bold text-gray-900">{parseFloat(String(config.ticket_value))}F</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1.5 border-t border-gray-50">
                    <span className="text-xs text-gray-500">Durée de validité</span>
                    <span className="text-sm font-bold text-gray-900">{config.validity_days || '-'} jours</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1.5 border-t border-gray-50">
                    <span className="text-xs text-gray-500">Auto-renouvellement</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      config.auto_renewal 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
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

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-[slideUp_0.3s_ease-out]"
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                    {selectedConfig ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedConfig ? 'Modifier la Configuration' : 'Nouvelle Configuration'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Définissez les paramètres du ticket</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pt-6 pb-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Valeur du ticket */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <DollarSign className="w-3.5 h-3.5 text-orange-500" />
                    Valeur du ticket (F CFA) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.ticket_value}
                      onChange={(e) => setFormData({ ...formData, ticket_value: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                      placeholder="500"
                      min="100"
                      step="50"
                      required
                    />
                  </div>
                </div>

                {/* Durée de validité */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    Durée de validité (jours) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.validity_duration_days}
                      onChange={(e) => setFormData({ ...formData, validity_duration_days: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
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
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Tag className="w-3.5 h-3.5 text-orange-500" />
                  Type de ticket <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'standard' | 'premium' | 'bonus' })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 appearance-none cursor-pointer"
                  required
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="bonus">Bonus</option>
                </select>
              </div>

              {/* Logo du ticket */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Image className="w-3.5 h-3.5 text-orange-500" />
                  Logo du ticket (optionnel)
                </label>
                <div>
                  {logoPreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-28 h-28 object-contain border-2 border-gray-200 rounded-xl bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50/50 hover:border-orange-300 hover:bg-orange-50/30 transition-all">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-1.5">
                        <Upload className="w-5 h-5 text-orange-400" />
                      </div>
                      <p className="text-xs text-gray-600 font-semibold">Cliquez pour télécharger</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, SVG (MAX. 2MB)</p>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Auto-renouvellement */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-all">
                <input
                  type="checkbox"
                  id="auto_renewal"
                  checked={formData.auto_renewal}
                  onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-orange-500" />
                  <label htmlFor="auto_renewal" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Activer le renouvellement automatique
                  </label>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedConfig ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-[slideUp_0.3s_ease-out]"
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
                    <h3 className="text-lg font-bold text-gray-900">Supprimer la configuration</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDeleteModal(false); setConfigToDelete(null); }}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 pt-6 pb-6">
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir supprimer cette configuration ?
                </p>
                <div className="flex items-start gap-2 mt-3 bg-red-100/50 rounded-lg p-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-semibold">Cette action ne peut pas être annulée.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setConfigToDelete(null); }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 flex items-center justify-center gap-2"
                >
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

export default TicketConfiguration;
