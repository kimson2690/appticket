import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Calendar, 
  Hash,
  CheckCircle,
  XCircle,
  X,
  AlertTriangle,
  Package,
  TrendingUp,
  Clock
} from 'lucide-react';
import { apiService, type TicketBatch, type TicketConfiguration } from '../services/api';

const TicketBatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<TicketBatch[]>([]);
  const [configurations, setConfigurations] = useState<TicketConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; title: string } | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    config_id: '',
    total_tickets: 20,
    validity_start: new Date().toISOString().split('T')[0],
    validity_end: ''
  });

  const currentUser = {
    role: localStorage.getItem('userRole') || 'Utilisateur',
    companyId: localStorage.getItem('userCompanyId') || null,
    userName: localStorage.getItem('userName') || 'Utilisateur'
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [batchData, configData] = await Promise.all([
        apiService.getTicketBatches(),
        apiService.getTicketConfigurations()
      ]);
      setBatches(batchData);
      setConfigurations(configData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les souches de tickets.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = () => {
    setFormData({
      config_id: '',
      total_tickets: 20,
      validity_start: new Date().toISOString().split('T')[0],
      validity_end: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const selectedConfig = configurations.find(c => c.id === formData.config_id);
      if (!selectedConfig) {
        setNotification({
          type: 'error',
          title: 'Configuration invalide',
          message: 'Veuillez sélectionner une configuration valide.'
        });
        return;
      }

      const batchData = {
        company_id: currentUser.companyId || '1',
        config_id: formData.config_id,
        created_by: currentUser.userName,
        total_tickets: formData.total_tickets,
        ticket_value: selectedConfig.ticket_value,
        type: selectedConfig.type,
        validity_start: formData.validity_start,
        validity_end: formData.validity_end
      };

      const newBatch = await apiService.createTicketBatch(batchData);
      setBatches([...batches, newBatch]);
      
      setNotification({
        type: 'success',
        title: 'Souche créée',
        message: `${formData.total_tickets} tickets ont été générés avec succès.`
      });
      
      setShowModal(false);
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de création',
        message: 'Une erreur est survenue lors de la création de la souche.'
      });
    }
  };

  const handleDeleteBatch = (batchId: string) => {
    setBatchToDelete(batchId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (batchToDelete) {
      try {
        await apiService.deleteTicketBatch(batchToDelete);
        setBatches(batches.filter(batch => batch.id !== batchToDelete));
        
        setNotification({
          type: 'info',
          title: 'Souche supprimée',
          message: 'La souche de tickets a été supprimée.'
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
    setBatchToDelete(null);
  };

  // Gestion de la sélection multiple
  const handleSelectBatch = (batchId: string) => {
    setSelectedBatches(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBatches.length === filteredBatches.length) {
      setSelectedBatches([]);
    } else {
      setSelectedBatches(filteredBatches.map(b => b.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedBatches.length > 0) {
      setShowBulkDeleteModal(true);
    }
  };

  const handleConfirmBulkDelete = async () => {
    try {
      // Supprimer toutes les souches sélectionnées
      await Promise.all(
        selectedBatches.map(batchId => apiService.deleteTicketBatch(batchId))
      );
      
      setBatches(batches.filter(batch => !selectedBatches.includes(batch.id)));
      setSelectedBatches([]);
      
      setNotification({
        type: 'success',
        title: 'Souches supprimées',
        message: `${selectedBatches.length} souche(s) supprimée(s) avec succès.`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      console.error('Erreur lors de la suppression multiple:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de suppression',
        message: 'Une erreur est survenue lors de la suppression multiple.'
      });
    }
    setShowBulkDeleteModal(false);
  };

  // Calculer les souches filtrées
  const filteredBatches = batches.filter((batch) => {
    if (employeeFilter === 'with_employee') return batch.employee_name;
    if (employeeFilter === 'without_employee') return !batch.employee_name;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'depleted': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'expired': return 'Expirée';
      case 'depleted': return 'Épuisée';
      default: return status;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des souches...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Souches de Tickets</h1>
          <p className="text-gray-600">
            Générez des tickets en lot pour votre entreprise
          </p>
        </div>
        <button
          onClick={handleCreateBatch}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle Souche</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Souches</p>
              <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Ticket className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Tickets Totaux</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.reduce((sum, batch) => sum + batch.total_tickets, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Consommés</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.reduce((sum, batch) => sum + batch.used_tickets, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Restants</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.reduce((sum, batch) => sum + batch.remaining_tickets, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Souches Actives</p>
              <p className="text-2xl font-bold text-gray-900">
                {batches.filter(b => b.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des souches */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Souches Créées</h2>
            
            {/* Filtre par employé */}
            {batches.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Filtrer :</label>
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Toutes les souches</option>
                  <option value="with_employee">Avec employé</option>
                  <option value="without_employee">Sans employé</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Actions de sélection multiple */}
          {filteredBatches.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBatches.length === filteredBatches.length && filteredBatches.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">Tout sélectionner</span>
                </label>
                {selectedBatches.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedBatches.length} sélectionnée(s)
                  </span>
                )}
              </div>
              
              {selectedBatches.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer ({selectedBatches.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="p-6">
          {batches.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune souche</h3>
              <p className="text-gray-600 mb-6">Créez votre première souche de tickets.</p>
              <button
                onClick={handleCreateBatch}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Créer une souche
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBatches.map((batch) => (
                <div key={batch.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4 mb-4">
                    {/* Checkbox de sélection */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedBatches.includes(batch.id)}
                        onChange={() => handleSelectBatch(batch.id)}
                        className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {batch.batch_number || `Souche #${batch.id.split('_')[1]}`}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                          {getStatusLabel(batch.status)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(batch.type)}`}>
                          {batch.type}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Créée par {batch.created_by} le {new Date(batch.created_at).toLocaleDateString('fr-FR')}</p>
                        {batch.employee_name && (
                          <p className="text-sm font-medium text-blue-600 flex items-center">
                            <span className="mr-1">👤</span>
                            Attribuée à : {batch.employee_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteBatch(batch.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total</p>
                      <p className="font-semibold text-gray-900 text-lg">{batch.total_tickets}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Consommés</p>
                      <p className="font-semibold text-orange-600 text-lg">{batch.used_tickets}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Restants</p>
                      <p className="font-semibold text-green-600 text-lg">{batch.remaining_tickets}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Valeur</p>
                      <p className="font-semibold text-gray-900 text-lg">{batch.ticket_value}F</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Validité début:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(batch.validity_start).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Validité fin:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {new Date(batch.validity_end).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression - Consommation réelle */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Consommation réelle</span>
                      <span className="font-medium text-gray-900">
                        {Math.round((batch.used_tickets / batch.total_tickets) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${(batch.used_tickets / batch.total_tickets) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Reflète les tickets réellement dépensés par les employés</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Nouvelle Souche de Tickets</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration de tickets *
                </label>
                <select
                  value={formData.config_id}
                  onChange={(e) => {
                    const selectedConfig = configurations.find(c => c.id === e.target.value);
                    const startDate = new Date(formData.validity_start);
                    const endDate = new Date(startDate);
                    if (selectedConfig) {
                      endDate.setDate(startDate.getDate() + selectedConfig.validity_duration_days);
                    }
                    setFormData({ 
                      ...formData, 
                      config_id: e.target.value,
                      validity_end: endDate.toISOString().split('T')[0]
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionnez une configuration</option>
                  {configurations.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.type} - {config.ticket_value}F - {config.validity_duration_days} jours
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de tickets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de tickets dans la souche *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.total_tickets}
                    onChange={(e) => setFormData({ ...formData, total_tickets: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="20"
                    min="1"
                    max="1000"
                    required
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">Exemple: 20 tickets = 1 souche de 20 tickets</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date de début */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début de validité *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.validity_start}
                      onChange={(e) => {
                        const selectedConfig = configurations.find(c => c.id === formData.config_id);
                        const startDate = new Date(e.target.value);
                        const endDate = new Date(startDate);
                        if (selectedConfig) {
                          endDate.setDate(startDate.getDate() + selectedConfig.validity_duration_days);
                        }
                        setFormData({ 
                          ...formData, 
                          validity_start: e.target.value,
                          validity_end: endDate.toISOString().split('T')[0]
                        });
                      }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Date de fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin de validité *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={formData.validity_end}
                      min={formData.validity_start}
                      onChange={(e) => setFormData({ ...formData, validity_end: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">Modifiable manuellement ou calculée automatiquement</p>
                </div>
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
                  <Package className="w-4 h-4" />
                  <span>Générer la souche</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression individuelle */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Supprimer la souche
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Êtes-vous sûr de vouloir supprimer cette souche de tickets ? 
              Cette action est <strong>irréversible</strong>.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setBatchToDelete(null);
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

      {/* Modal de confirmation de suppression multiple */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Supprimer {selectedBatches.length} souche(s)
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Êtes-vous sûr de vouloir supprimer <strong>{selectedBatches.length} souche(s)</strong> de tickets ? 
              Cette action est <strong>irréversible</strong> et supprimera toutes les souches sélectionnées.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors"
              >
                Supprimer tout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketBatchManagement;
