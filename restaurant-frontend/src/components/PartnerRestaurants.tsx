import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Check,
  X,
  Search,
  MapPin,
  Phone,
  Mail,
  Star,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { apiService, type Restaurant as ApiRestaurant } from '../services/api';

interface Restaurant {
  id: string;
  name: string;
  cuisine_type: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  delivery_fee: number;
  min_order: number;
  is_active: boolean;
}

const PartnerRestaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [initialSelection, setInitialSelection] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; title: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [availableRestaurants, partnerData] = await Promise.all([
        apiService.getAvailableRestaurants(),
        apiService.getPartnerRestaurants()
      ]);
      
      // Convertir les restaurants API en format local
      const localRestaurants: Restaurant[] = availableRestaurants.map(r => ({
        id: r.id,
        name: r.name,
        cuisine_type: r.cuisine_type,
        address: r.address,
        phone: r.phone,
        email: r.email,
        rating: r.rating || r.average_rating || 0,
        delivery_fee: r.delivery_fee,
        min_order: r.min_order || r.minimum_order || 0,
        is_active: r.is_active !== undefined ? r.is_active : r.status === 'active'
      }));
      
      setRestaurants(localRestaurants);
      setSelectedRestaurants(partnerData.restaurant_ids || []);
      setInitialSelection(partnerData.restaurant_ids || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les restaurants.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRestaurant = (restaurantId: string) => {
    setSelectedRestaurants(prev =>
      prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRestaurants.length === restaurants.length) {
      setSelectedRestaurants([]);
    } else {
      setSelectedRestaurants(restaurants.map(r => r.id));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updatePartnerRestaurants(selectedRestaurants);
      
      setInitialSelection(selectedRestaurants);
      setNotification({
        type: 'success',
        title: 'Partenariats mis à jour',
        message: `${selectedRestaurants.length} restaurant(s) partenaire(s) sélectionné(s).`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Impossible de sauvegarder les partenariats.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedRestaurants(initialSelection);
    setNotification({
      type: 'info',
      title: 'Modifications annulées',
      message: 'Les modifications ont été annulées.'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.cuisine_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasChanges = JSON.stringify(selectedRestaurants.sort()) !== JSON.stringify(initialSelection.sort());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md w-full bg-white rounded-lg shadow-lg border-l-4 ${
          notification.type === 'success' ? 'border-green-500' :
          notification.type === 'error' ? 'border-red-500' : 'border-blue-500'
        } p-4 animate-slide-in`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              {notification.type === 'info' && <AlertTriangle className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Store className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restaurants Partenaires</h1>
              <p className="text-sm text-gray-600">Sélectionnez les restaurants avec lesquels vous collaborez</p>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Restaurants Disponibles</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{restaurants.length}</p>
              </div>
              <Store className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Partenaires Sélectionnés</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{selectedRestaurants.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Modifications</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{hasChanges ? 'En attente' : 'Aucune'}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un restaurant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              {selectedRestaurants.length === restaurants.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
            
            {hasChanges && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Sauvegarder</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Liste des restaurants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRestaurants.map((restaurant) => {
          const isSelected = selectedRestaurants.includes(restaurant.id);
          
          return (
            <div
              key={restaurant.id}
              onClick={() => handleToggleRestaurant(restaurant.id)}
              className={`bg-white rounded-xl p-5 border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'border-orange-500 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {/* Header avec checkbox */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{restaurant.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
                    {restaurant.cuisine_type}
                  </span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'bg-orange-500 border-orange-500'
                    : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>

              {/* Informations */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="line-clamp-1">{restaurant.address}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span>{restaurant.phone}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                  <span className="line-clamp-1">{restaurant.email}</span>
                </div>
              </div>

              {/* Métriques */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="flex items-center justify-center text-yellow-500 mb-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm font-semibold text-gray-900">{restaurant.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500">Note</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center text-green-600 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-900">{restaurant.delivery_fee}F</span>
                  </div>
                  <p className="text-xs text-gray-500">Livraison</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center text-blue-600 mb-1">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-900">{restaurant.min_order}F</span>
                  </div>
                  <p className="text-xs text-gray-500">Min.</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* État vide */}
      {filteredRestaurants.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun restaurant trouvé</h3>
          <p className="text-gray-600">Essayez de modifier vos critères de recherche.</p>
        </div>
      )}
    </div>
  );
};

export default PartnerRestaurants;
