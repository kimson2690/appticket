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
  Info
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <MapPin size={28} />
                  {selectedLocation ? 'Modifier le lieu' : 'Nouveau lieu de livraison'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Nom du lieu */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du lieu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Ex: Bureau Principal, Cafétéria, Entrepôt..."
                  required
                />
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Adresse complète
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="123 Avenue Example, Dakar..."
                  rows={2}
                />
              </div>

              {/* Bâtiment et Étage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bâtiment
                  </label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="Ex: Bâtiment A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Étage
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="Ex: 3, RDC, Sous-sol..."
                  />
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Instructions de livraison
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Informations utiles pour le livreur (code d'accès, consignes spéciales...)"
                  rows={3}
                />
              </div>

              {/* Statut actif */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Lieu actif (visible pour les employés)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-lg"
                >
                  {selectedLocation ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Supprimer le lieu ?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Êtes-vous sûr de vouloir supprimer <strong>{selectedLocation.name}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedLocation(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
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

export default DeliveryLocationManagement;
