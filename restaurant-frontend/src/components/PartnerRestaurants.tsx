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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement des restaurants...</p>
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
              {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
              {notification.type === 'info' && <AlertTriangle className="w-4 h-4 text-blue-600" />}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurants Partenaires</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sélectionnez les restaurants avec lesquels vous collaborez</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Restaurants Disponibles</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{restaurants.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Store className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Partenaires Sélectionnés</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{selectedRestaurants.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Taux de Couverture</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">
                {restaurants.length > 0 ? Math.round((selectedRestaurants.length / restaurants.length) * 100) : 0}%
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
              <Star className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un restaurant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300 placeholder:text-gray-400"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              {selectedRestaurants.length === restaurants.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>

            {hasChanges && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-orange-100"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
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
      {filteredRestaurants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Aucun restaurant trouvé</h3>
          <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRestaurants.map((restaurant) => {
            const isSelected = selectedRestaurants.includes(restaurant.id);

            return (
              <div
                key={restaurant.id}
                onClick={() => handleToggleRestaurant(restaurant.id)}
                className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer group ${
                  isSelected
                    ? 'border-orange-400 shadow-md shadow-orange-50'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                }`}
              >
                {/* Header avec checkbox */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm">{restaurant.name}</h3>
                    <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-50 border border-orange-200 text-orange-700">
                      {restaurant.cuisine_type}
                    </span>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500 border-emerald-500 scale-110'
                      : 'border-gray-300 group-hover:border-gray-400'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>

                {/* Informations */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-1">{restaurant.address}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{restaurant.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="line-clamp-1">{restaurant.email}</span>
                  </div>
                </div>

                {/* Métriques */}
                <div className="pt-3 border-t border-gray-50 grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-current" />
                      <span className="text-xs font-bold text-gray-900">{restaurant.rating}</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Note</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <DollarSign className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-bold text-gray-900">{restaurant.delivery_fee}F</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Livraison</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      <ShoppingBag className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-bold text-gray-900">{restaurant.min_order}F</span>
                    </div>
                    <p className="text-[10px] text-gray-400">Min.</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartnerRestaurants;
