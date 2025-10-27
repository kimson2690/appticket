import React, { useState, useEffect } from 'react';
import {
  Store, ShoppingCart, Plus, Minus, Trash2, Check,
  ChefHat, MapPin, Star, Wallet, AlertCircle, CheckCircle, Search, Filter
} from 'lucide-react';
import { apiService, type Restaurant, type MenuItem, type OrderItem, type DeliveryLocation } from '../services/api';

interface CartItem extends OrderItem {
  name: string;
  restaurant_id: string;
  restaurant_name: string;
}

const RestaurantOrderSystem: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketBalance, setTicketBalance] = useState(0);
  const [deliveryLocations, setDeliveryLocations] = useState<DeliveryLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error'; message: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRestaurantTab, setActiveRestaurantTab] = useState<string | 'all'>('all');

  const baseUrl = 'http://localhost:8001/api';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');
      const companyId = localStorage.getItem('userCompanyId');

      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': userId || '',
        'X-User-Name': userName || '',
        'X-User-Company-Id': companyId || '',
      };

      const restaurantsRes = await fetch(`${baseUrl}/employee/restaurants`, { headers });
      const restaurantsData = await restaurantsRes.json();
      if (restaurantsData.success) {
        setRestaurants(restaurantsData.data.filter((r: Restaurant) => 
          r.status === 'active' || r.is_active === true
        ));
      }

      const itemsRes = await fetch(`${baseUrl}/employee/menu-items`, { headers });
      const itemsData = await itemsRes.json();
      if (itemsData.success) {
        console.log(`📅 Plats disponibles pour ${itemsData.current_day}:`, itemsData.data);
        setMenuItems(itemsData.data);
      }

      const balanceRes = await fetch(`${baseUrl}/employee/ticket-balance`, { headers });
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setTicketBalance(balanceData.data.ticket_balance);
      }

      // Charger les lieux de livraison actifs
      const locationsRes = await fetch(`${baseUrl}/company/delivery-locations/active`, { headers });
      const locationsData = await locationsRes.json();
      if (locationsData.success) {
        setDeliveryLocations(locationsData.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredMenus = () => {
    let filtered = menuItems;
    
    if (activeRestaurantTab !== 'all') {
      filtered = filtered.filter(item => item.restaurant_id === activeRestaurantTab);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    if (cart.length > 0 && cart[0].restaurant_id !== restaurant.id) {
      showNotification('error', 'Vous ne pouvez commander que dans un seul restaurant à la fois.');
      return;
    }

    const existing = cart.find(c => c.item_id === item.id);
    if (existing) {
      setCart(cart.map(c =>
        c.item_id === item.id
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        item_id: item.id,
        quantity: 1,
        price: item.price,
        name: item.name,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name
      }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.item_id === itemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.item_id !== itemId));
  };

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(amount) + 'F';
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Vérifier qu'un lieu de livraison est sélectionné
    if (!selectedLocation) {
      showNotification('error', 'Veuillez sélectionner un lieu de livraison avant de confirmer votre commande.');
      return;
    }

    const total = getTotalAmount();
    if (total > ticketBalance) {
      showNotification('error', `Solde insuffisant. Il vous faut ${formatCurrency(total)} mais vous n'avez que ${formatCurrency(ticketBalance)}.`);
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      const orderData = {
        restaurant_id: cart[0].restaurant_id,
        items: cart.map(({ item_id, quantity, price, name, restaurant_name }) => ({ 
          item_id, 
          quantity, 
          price, 
          name, 
          restaurant_name 
        })),
        delivery_location_id: selectedLocation || undefined,
        delivery_address: deliveryAddress || undefined,
        notes: notes || undefined
      };

      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': userId || '',
        'X-User-Name': userName || '',
      };

      const response = await fetch(`${baseUrl}/employee/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (data.success) {
        showNotification('success', `Commande passée avec succès ! Montant: ${formatCurrency(total)}`);
        setCart([]);
        setSelectedLocation(null);
        setDeliveryAddress('');
        setNotes('');
        loadData();
      } else {
        showNotification('error', data.error || 'Erreur lors de la commande');
      }
    } catch (error) {
      showNotification('error', 'Erreur lors de la commande');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 ${notification.type === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} border-l-4 p-4 rounded-lg shadow-lg max-w-md animate-slide-down`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            )}
            <p className={`text-sm ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Header moderne */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Commander un Repas</h1>
                <p className="text-orange-100 text-sm">Vos plats préférés livrés</p>
              </div>
            </div>

            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un plat, restaurant..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-0 shadow-lg focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-orange-100" />
                  <div>
                    <p className="text-xs text-orange-100">Solde</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(ticketBalance)}</p>
                  </div>
                </div>
              </div>
              <div className="relative bg-white text-orange-600 p-3 rounded-xl shadow-lg">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres restaurants */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">🍽️ Nos Plats Disponibles</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>{getFilteredMenus().length} plat(s)</span>
            </div>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveRestaurantTab('all')}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeRestaurantTab === 'all'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-orange-50 border'
              }`}
            >
              Tous
            </button>
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => setActiveRestaurantTab(restaurant.id)}
                className={`px-6 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
                  activeRestaurantTab === restaurant.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-orange-50 border'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{restaurant.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {getFilteredMenus().length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun plat trouvé</h3>
                <p className="text-gray-500">Essayez une autre recherche.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {getFilteredMenus().map((item) => {
                  const restaurant = restaurants.find(r => r.id === item.restaurant_id);
                  if (!restaurant) return null;

                  return (
                    <div key={item.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-orange-300">
                      <div className="relative h-48 bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ChefHat className="w-16 h-16 text-orange-300" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <div className="flex items-center space-x-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                            <Store className="w-3 h-3 text-orange-600" />
                            <span className="text-xs font-medium text-gray-700">{restaurant.name}</span>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="bg-orange-500 text-white text-xs font-medium px-2 py-1 rounded-lg shadow-sm">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-10">{item.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            <span className="text-2xl font-bold text-gray-900">{formatCurrency(item.price).split('F')[0]}</span>
                            <span className="text-lg font-bold text-gray-600">F</span>
                          </div>
                          <button
                            onClick={() => addToCart(item, restaurant)}
                            className="w-10 h-10 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center shadow-lg hover:scale-110"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panier */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4 border">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">🛒 Mon Panier</h3>
                  <p className="text-xs text-gray-500 mt-1">{cart.length} article(s)</p>
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Panier vide</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.item_id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(item.price)} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center bg-white rounded-lg shadow-sm">
                            <button
                              onClick={() => updateQuantity(item.item_id, -1)}
                              className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-l-lg"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-sm w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.item_id, 1)}
                              className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-r-lg"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.item_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 mb-6 border-t pt-4">
                    {/* Sélection du lieu de livraison */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        Lieu de livraison <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedLocation || ''}
                        onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          !selectedLocation && deliveryLocations.length > 0 ? 'border-red-300' : ''
                        }`}
                        required
                      >
                        <option value="">Sélectionnez un lieu *</option>
                        {deliveryLocations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                            {location.building && ` - ${location.building}`}
                            {location.floor && ` - Étage ${location.floor}`}
                          </option>
                        ))}
                      </select>
                      {deliveryLocations.length === 0 ? (
                        <p className="text-sm text-red-600 mt-1 font-medium">
                          ⚠️ Aucun lieu de livraison configuré. Contactez votre gestionnaire.
                        </p>
                      ) : !selectedLocation && (
                        <p className="text-sm text-orange-600 mt-1 font-medium">
                          ⚠️ Veuillez sélectionner un lieu de livraison pour continuer
                        </p>
                      )}
                    </div>

                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Adresse complémentaire (optionnel)"
                    />
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Notes (optionnel)"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-4 text-lg font-bold">
                      <span>Total</span>
                      <span className="text-orange-600">{formatCurrency(getTotalAmount())}</span>
                    </div>

                    {getTotalAmount() > ticketBalance && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-800">
                          Solde insuffisant
                        </p>
                      </div>
                    )}

                    {!selectedLocation && deliveryLocations.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-orange-800 font-medium">
                          📍 Veuillez sélectionner un lieu de livraison
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={getTotalAmount() > ticketBalance || !selectedLocation}
                      className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Check className="w-5 h-5" />
                      <span>Confirmer</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrderSystem;
