import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Building2,
  X,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Navigation,
  Layers,
  Info,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Eye
} from 'lucide-react';
import { apiService } from '../services/api';

interface DeliveryLocation {
  id: number;
  company_id: number;
  name: string;
  address?: string;
  building?: string;
  floor?: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DeliveryLocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<DeliveryLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    building: '',
    floor: '',
    instructions: '',
    is_active: true
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getDeliveryLocations();
      setLocations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des lieux de livraison');
      console.error('Error loading delivery locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (location?: DeliveryLocation) => {
    if (location) {
      setSelectedLocation(location);
      setFormData({
        name: location.name,
        address: location.address || '',
        building: location.building || '',
        floor: location.floor || '',
        instructions: location.instructions || '',
        is_active: location.is_active
      });
    } else {
      setSelectedLocation(null);
      setFormData({
        name: '',
        address: '',
        building: '',
        floor: '',
        instructions: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLocation(null);
    setFormData({
      name: '',
      address: '',
      building: '',
      floor: '',
      instructions: '',
      is_active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedLocation) {
        await apiService.updateDeliveryLocation(selectedLocation.id, formData);
      } else {
        await apiService.createDeliveryLocation(formData);
      }
      await loadLocations();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
      console.error('Error saving location:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedLocation) return;
    
    try {
      await apiService.deleteDeliveryLocation(selectedLocation.id);
      await loadLocations();
      setShowDeleteModal(false);
      setSelectedLocation(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      console.error('Error deleting location:', err);
    }
  };

  const handleToggleActive = async (location: DeliveryLocation) => {
    try {
      await apiService.toggleDeliveryLocation(location.id);
      await loadLocations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modification du statut');
      console.error('Error toggling location:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapPin className="text-orange-500" size={32} />
              Lieux de Livraison
            </h1>
            <p className="text-gray-600 mt-2">
              Gérez les points de livraison pour vos employés
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Nouveau Lieu
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-500" size={20} />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X size={20} />
          </button>
        </div>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 ${
              location.is_active ? 'border-green-200' : 'border-gray-200'
            } overflow-hidden`}
          >
            {/* Header */}
            <div className={`p-4 ${location.is_active ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gray-50'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{location.name}</h3>
                  <div className="flex items-center gap-2">
                    {location.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Inactif
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(location)}
                  className={`p-2 rounded-lg transition-colors ${
                    location.is_active
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={location.is_active ? 'Désactiver' : 'Activer'}
                >
                  {location.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {location.address && (
                <div className="flex items-start gap-2 text-sm">
                  <Navigation className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                  <span className="text-gray-700">{location.address}</span>
                </div>
              )}

              {(location.building || location.floor) && (
                <div className="flex items-start gap-2 text-sm">
                  <Building2 className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                  <span className="text-gray-700">
                    {location.building && `${location.building}`}
                    {location.building && location.floor && ' - '}
                    {location.floor && `Étage ${location.floor}`}
                  </span>
                </div>
              )}

              {location.instructions && (
                <div className="flex items-start gap-2 text-sm">
                  <Info className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                  <span className="text-gray-600 italic">{location.instructions}</span>
                </div>
              )}

              {!location.address && !location.building && !location.floor && !location.instructions && (
                <p className="text-gray-400 text-sm italic">Aucune information complémentaire</p>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 bg-gray-50 border-t flex gap-2">
              <button
                onClick={() => handleOpenModal(location)}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Edit size={16} />
                Modifier
              </button>
              <button
                onClick={() => {
                  setSelectedLocation(location);
                  setShowDeleteModal(true);
                }}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="col-span-full text-center py-16">
            <MapPin className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucun lieu de livraison</h3>
            <p className="text-gray-500 mb-6">Commencez par créer votre premier lieu de livraison</p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Créer un lieu
            </button>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_ease-out]"
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                    {selectedLocation ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {selectedLocation ? 'Modifier le lieu' : 'Nouveau lieu de livraison'}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Définissez les informations du lieu</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pt-6 pb-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Nom du lieu */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  Nom du lieu <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                  placeholder="Ex: Bureau Principal, Cafétéria, Entrepôt..."
                  required
                />
              </div>

              {/* Adresse */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Navigation className="w-3.5 h-3.5 text-orange-500" />
                  Adresse complète
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 resize-none"
                  placeholder="123 Avenue Example, Dakar..."
                  rows={2}
                />
              </div>

              {/* Bâtiment et Étage */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Building2 className="w-3.5 h-3.5 text-orange-500" />
                    Bâtiment
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="Ex: Bâtiment A"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Layers className="w-3.5 h-3.5 text-orange-500" />
                    Étage
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="Ex: 3, RDC, Sous-sol..."
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  Instructions de livraison
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 resize-none"
                  placeholder="Informations utiles pour le livreur (code d'accès, consignes spéciales...)"
                  rows={3}
                />
              </div>

              {/* Statut actif */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-all">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-orange-500" />
                  <label htmlFor="is_active" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Lieu actif (visible pour les employés)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedLocation ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLocation && (
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
                    <h3 className="text-lg font-bold text-gray-900">Supprimer le lieu</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedLocation(null); }}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 pt-6 pb-6">
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir supprimer <strong className="text-gray-900">"{selectedLocation.name}"</strong> ?
                </p>
                <div className="flex items-start gap-2 mt-3 bg-red-100/50 rounded-lg p-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-semibold">Cette action ne peut pas être annulée.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setSelectedLocation(null); }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
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

export default DeliveryLocationManagement;
