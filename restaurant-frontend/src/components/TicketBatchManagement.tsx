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
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { apiService, type TicketBatch, type TicketConfiguration } from '../services/api';
import Pagination from './Pagination';

const TicketBatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<TicketBatch[]>([]);
  const [configurations, setConfigurations] = useState<TicketConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; title: string } | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [batchPage, setBatchPage] = useState(1);
  const BATCHES_PER_PAGE = 10;

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
        ticket_value: parseFloat(selectedConfig.ticket_value),
        type: 'standard' as const, // Backend n'utilise plus ce champ
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

  // Calculer les souches filtrées par période et statut
  const filteredBatchesAll = batches.filter((batch) => {
    // Filtre par statut
    if (statusFilter === 'active' && batch.status !== 'active') return false;
    if (statusFilter === 'expired' && batch.status !== 'expired') return false;

    const createdDate = new Date(batch.created_at);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Filtre personnalisé par dates
    if (periodFilter === 'custom') {
      if (customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        return createdDate >= startDate && createdDate <= endDate;
      }
      return true;
    }
    
    // Filtres prédéfinis
    if (periodFilter === 'today') return daysDiff === 0;
    if (periodFilter === 'week') return daysDiff <= 7;
    if (periodFilter === 'month') return daysDiff <= 30;
    if (periodFilter === 'all') return true;
    return true;
  });

  const filteredBatches = filteredBatchesAll;
  const paginatedBatches = filteredBatches.slice((batchPage - 1) * BATCHES_PER_PAGE, batchPage * BATCHES_PER_PAGE);

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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement des souches...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Souches de Tickets</h1>
          <p className="text-sm text-gray-400 mt-0.5">Générez des tickets en lot pour votre entreprise</p>
        </div>
        <button
          onClick={handleCreateBatch}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-orange-100"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Souche</span>
        </button>
      </div>

      {/* Statistiques */}
      {(() => {
        const totalTickets = batches.reduce((sum, b) => sum + b.total_tickets, 0);
        const ticketsConsommes = batches.reduce((sum, b) => sum + b.used_tickets, 0);
        const ticketsPerdus = batches.filter(b => b.status === 'expired').reduce((sum, b) => sum + b.remaining_tickets, 0);
        const ticketsDisponibles = totalTickets - ticketsConsommes - ticketsPerdus;
        const montantPerdu = batches.filter(b => b.status === 'expired').reduce((sum, b) => sum + b.remaining_tickets * b.ticket_value, 0);
        const montantDisponible = batches.filter(b => b.status === 'active').reduce((sum, b) => sum + b.remaining_tickets * b.ticket_value, 0);
        const montantConsomme = batches.reduce((sum, b) => sum + b.used_tickets * b.ticket_value, 0);

        return (<>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Tickets Générés</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalTickets}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{batches.length} souches</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Tickets Consommés</p>
              <p className="text-3xl font-extrabold text-orange-600 mt-1">{ticketsConsommes}</p>
              <p className="text-[10px] text-orange-400 mt-0.5">{Math.round(montantConsomme).toLocaleString('fr-FR')} F</p>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Tickets Disponibles</p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">{ticketsDisponibles}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">{Math.round(montantDisponible).toLocaleString('fr-FR')} F</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Tickets Perdus</p>
              <p className="text-3xl font-extrabold text-red-500 mt-1">{ticketsPerdus}</p>
              <p className="text-[10px] text-red-400 mt-0.5">{Math.round(montantPerdu).toLocaleString('fr-FR')} F</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Taux d'utilisation</p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-1">
                {totalTickets > 0 ? Math.round((ticketsConsommes / totalTickets) * 100) : 0}%
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{ticketsConsommes} / {totalTickets}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 font-medium">Souches Actives</p>
              <p className="text-2xl font-extrabold text-emerald-800">
                {batches.filter(b => b.status === 'active').length}
              </p>
              <p className="text-[10px] text-emerald-500">sur {batches.length} souches</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-red-700 font-medium">Souches Expirées</p>
              <p className="text-2xl font-extrabold text-red-800">
                {batches.filter(b => b.status === 'expired').length}
              </p>
              <p className="text-[10px] text-red-500">sur {batches.length} souches</p>
            </div>
          </div>
        </div>
      </div>
      </>);
      })()}

      {/* Filtres et liste des souches */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="space-y-3 mb-3">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900">Souches Créées</h2>
              
              {/* Filtres */}
              {batches.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filtre par statut */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Statut :</span>
                    <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => { setStatusFilter('all'); setBatchPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                          statusFilter === 'all'
                            ? 'bg-orange-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        Toutes
                      </button>
                      <button
                        onClick={() => { setStatusFilter('active'); setBatchPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200 ${
                          statusFilter === 'active'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Actives ({batches.filter(b => b.status === 'active').length})
                        </span>
                      </button>
                      <button
                        onClick={() => { setStatusFilter('expired'); setBatchPage(1); }}
                        className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-gray-200 ${
                          statusFilter === 'expired'
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Expirées ({batches.filter(b => b.status === 'expired').length})
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Filtre par période */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Période :</span>
                    <select
                      value={periodFilter}
                      onChange={(e) => { setPeriodFilter(e.target.value); setBatchPage(1); }}
                      className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    >
                      <option value="all">Toutes les périodes</option>
                      <option value="today">Aujourd'hui</option>
                      <option value="week">7 derniers jours</option>
                      <option value="month">30 derniers jours</option>
                      <option value="custom">Période personnalisée</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Sélection de dates personnalisées */}
            {periodFilter === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
                <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-gray-700">Du :</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    />
                  </div>
                  <span className="text-gray-400 text-xs">→</span>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-medium text-gray-700">Au :</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    />
                  </div>
                </div>
                {customStartDate && customEndDate && (
                  <button
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Actions de sélection multiple */}
          {filteredBatches.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBatches.length === filteredBatches.length && filteredBatches.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-xs text-gray-600 font-medium">Tout sélectionner</span>
                </label>
                {selectedBatches.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {selectedBatches.length} sélectionnée(s)
                  </span>
                )}
              </div>
              
              {selectedBatches.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer ({selectedBatches.length})</span>
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="p-5">
          {batches.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Aucune souche</h3>
              <p className="text-sm text-gray-400 mb-6">Créez votre première souche de tickets</p>
              <button
                onClick={handleCreateBatch}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Créer une souche
              </button>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Aucune souche pour cette période</h3>
              <p className="text-sm text-gray-400 mb-6">Aucune souche ne correspond aux critères sélectionnés</p>
              <button
                onClick={() => setPeriodFilter('all')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                Afficher toutes les souches
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBatches.map((batch) => (
                <div 
                  key={batch.id} 
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  {/* Header: checkbox + info + status + delete */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={selectedBatches.includes(batch.id)}
                        onChange={() => handleSelectBatch(batch.id)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Package className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <h3 className="font-bold text-gray-900 text-sm truncate">
                          {batch.batch_number || `Souche #${batch.id.split('_')[1]}`}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${getTypeColor(batch.type)}`}>
                          {batch.type}
                        </span>
                      </div>
                      
                      {/* Métadonnées */}
                      <div className="space-y-0.5">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1.5 text-gray-400 flex-shrink-0" />
                          <span>Créée par <span className="font-semibold text-gray-700">{batch.created_by}</span> le {new Date(batch.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        {batch.employee_name && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Users className="w-3 h-3 mr-1.5 text-blue-500 flex-shrink-0" />
                            <span>Attribuée à</span>
                            <span className="ml-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-200">
                              {batch.employee_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(batch.status)}`}>
                        {getStatusLabel(batch.status)}
                      </span>
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Statistiques mini-cartes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Total</p>
                        <Ticket className="w-3 h-3 text-gray-400" />
                      </div>
                      <p className="text-lg font-extrabold text-gray-900">{batch.total_tickets}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[10px] font-bold text-orange-600 uppercase">Consommés</p>
                        <TrendingUp className="w-3 h-3 text-orange-400" />
                      </div>
                      <p className="text-lg font-extrabold text-orange-600">{batch.used_tickets}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Restants</p>
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      </div>
                      <p className="text-lg font-extrabold text-emerald-600">{batch.remaining_tickets}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[10px] font-bold text-purple-600 uppercase">Valeur</p>
                        <DollarSign className="w-3 h-3 text-purple-400" />
                      </div>
                      <p className="text-lg font-extrabold text-purple-600">{batch.ticket_value}F</p>
                    </div>
                  </div>

                  {/* Période de validité */}
                  <div className="bg-gray-50 rounded-xl p-2.5 mb-3 border border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500">Du</span>
                        <span className="px-2 py-0.5 bg-white rounded-lg font-bold text-gray-900 border border-gray-200 text-[11px]">
                          {new Date(batch.validity_start).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <span className="text-gray-300">→</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500">Au</span>
                        <span className="px-2 py-0.5 bg-white rounded-lg font-bold text-gray-900 border border-gray-200 text-[11px]">
                          {new Date(batch.validity_end).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-bold text-gray-700">Consommation</span>
                      </div>
                      <span className="text-sm font-extrabold text-orange-600">
                        {Math.round((batch.used_tickets / batch.total_tickets) * 100)}%
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${(batch.used_tickets / batch.total_tickets) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-2.5 h-2.5" />
                      {batch.used_tickets} / {batch.total_tickets} tickets
                    </p>
                  </div>
                </div>
              ))}
              <Pagination
                currentPage={batchPage}
                totalItems={filteredBatches.length}
                itemsPerPage={BATCHES_PER_PAGE}
                onPageChange={setBatchPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]"
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Nouvelle Souche de Tickets</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Générez une nouvelle souche avec ses tickets</p>
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

            <form onSubmit={handleSubmit} className="px-6 pt-6 pb-6 space-y-5">
              {/* Configuration */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Settings className="w-3.5 h-3.5 text-orange-500" />
                  Configuration de tickets <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.config_id}
                  onChange={(e) => {
                    const selectedConfig = configurations.find(c => c.id === e.target.value);
                    const startDate = new Date(formData.validity_start);
                    const endDate = new Date(startDate);
                    if (selectedConfig) {
                      endDate.setDate(startDate.getDate() + selectedConfig.validity_days);
                    }
                    setFormData({ 
                      ...formData, 
                      config_id: e.target.value,
                      validity_end: endDate.toISOString().split('T')[0]
                    });
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 appearance-none cursor-pointer"
                  required
                >
                  <option value="">Sélectionnez une configuration</option>
                  {configurations.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.company_name} - {config.ticket_value}F - {config.validity_days} jours
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de tickets */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Hash className="w-3.5 h-3.5 text-orange-500" />
                  Nombre de tickets dans la souche <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.total_tickets}
                    onChange={(e) => setFormData({ ...formData, total_tickets: Number(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="20"
                    min="1"
                    max="1000"
                    required
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-gray-400">Exemple: 20 tickets = 1 souche de 20 tickets</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Date de début */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    Date de début <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.validity_start}
                      onChange={(e) => {
                        const selectedConfig = configurations.find(c => c.id === formData.config_id);
                        const startDate = new Date(e.target.value);
                        const endDate = new Date(startDate);
                        if (selectedConfig) {
                          endDate.setDate(startDate.getDate() + selectedConfig.validity_days);
                        }
                        setFormData({ 
                          ...formData, 
                          validity_start: e.target.value,
                          validity_end: endDate.toISOString().split('T')[0]
                        });
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                      required
                    />
                  </div>
                </div>

                {/* Date de fin */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    Date de fin <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={formData.validity_end}
                      min={formData.validity_start}
                      onChange={(e) => setFormData({ ...formData, validity_end: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-400">Modifiable manuellement ou calculée automatiquement</p>
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
                  Générer la souche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression individuelle */}
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
                    <h3 className="text-lg font-bold text-gray-900">Supprimer la souche</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDeleteModal(false); setBatchToDelete(null); }}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 pt-6 pb-6">
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir supprimer cette souche de tickets ?
                </p>
                <div className="flex items-start gap-2 mt-3 bg-red-100/50 rounded-lg p-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-semibold">Cette action ne peut pas être annulée.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setBatchToDelete(null); }}
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

      {/* Modal de confirmation de suppression multiple */}
      {showBulkDeleteModal && (
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
                    <h3 className="text-lg font-bold text-gray-900">Supprimer {selectedBatches.length} souche(s)</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Suppression multiple irréversible</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 pt-6 pb-6">
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir supprimer <strong className="text-gray-900">{selectedBatches.length} souche(s)</strong> de tickets ?
                </p>
                <div className="flex items-start gap-2 mt-3 bg-red-100/50 rounded-lg p-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-semibold">Cette action ne peut pas être annulée.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmBulkDelete}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer tout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketBatchManagement;
