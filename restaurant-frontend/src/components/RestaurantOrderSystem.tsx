import React, { useState, useEffect } from 'react';
import {
  Store, ShoppingCart, Plus, Minus, Trash2, Check,
  ChefHat, MapPin, Wallet, AlertCircle, CheckCircle, Search, Filter, X, XCircle
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  const filteredMenus = getFilteredMenus();

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-sm ${
            notification.type === 'success' ? 'bg-emerald-50/95 border-emerald-200' : 'bg-red-50/95 border-red-200'
          }`}>
            <div className={`p-1.5 rounded-lg ${notification.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                : <XCircle className="w-4 h-4 text-red-600" />}
            </div>
            <p className={`text-xs font-medium ${notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>
              {notification.message}
            </p>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/50 rounded-lg ml-1">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Commander un Repas</h1>
                <p className="text-orange-100 text-xs">Vos plats préférés livrés</p>
              </div>
            </div>

            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un plat, restaurant..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-0 text-sm shadow-lg focus:ring-2 focus:ring-orange-300 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-orange-100" />
                  <div>
                    <p className="text-[10px] text-orange-200 font-medium">Solde</p>
                    <p className="text-base font-extrabold text-white leading-tight">{formatCurrency(ticketBalance)}</p>
                  </div>
                </div>
              </div>
              <div className="relative bg-white text-orange-600 p-2.5 rounded-xl shadow-lg">
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {cart.reduce((sum, c) => sum + c.quantity, 0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Section title + filters */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Nos Plats Disponibles</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Filter className="w-3.5 h-3.5" />
              <span className="font-medium">{filteredMenus.length} plat(s)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveRestaurantTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeRestaurantTab === 'all'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
              }`}
            >
              Tous
            </button>
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => setActiveRestaurantTab(restaurant.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeRestaurantTab === restaurant.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                    : 'bg-white text-gray-600 hover:bg-orange-50 border border-gray-200'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                {restaurant.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Plats */}
          <div className="lg:col-span-3">
            {filteredMenus.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Aucun plat trouvé</h3>
                <p className="text-sm text-gray-400">Essayez une autre recherche ou un autre restaurant</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredMenus.map((item) => {
                  const restaurant = restaurants.find(r => r.id === item.restaurant_id);
                  if (!restaurant) return null;
                  const cartItem = cart.find(c => c.item_id === item.id);

                  return (
                    <div key={item.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all">
                      {/* Image */}
                      <div className="relative h-40 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ChefHat className="w-12 h-12 text-orange-200" />
                          </div>
                        )}
                        {/* Restaurant badge */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-white/90 backdrop-blur-sm border border-white/50 text-gray-700 shadow-sm">
                            <Store className="w-3 h-3 text-orange-500" />
                            {restaurant.name}
                          </span>
                        </div>
                        {/* Category badge */}
                        <div className="absolute top-2.5 right-2.5">
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-500 text-white shadow-sm">
                            {item.category}
                          </span>
                        </div>
                        {/* Cart quantity indicator */}
                        {cartItem && (
                          <div className="absolute bottom-2.5 right-2.5">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white text-xs font-bold shadow-md">
                              {cartItem.quantity}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h3>
                        {item.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 min-h-[2rem]">{item.description}</p>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                          <div>
                            <span className="text-xl font-extrabold text-gray-900">{formatCurrency(item.price).split('F')[0]}</span>
                            <span className="text-sm font-bold text-gray-400">F</span>
                          </div>
                          <button
                            onClick={() => addToCart(item, restaurant)}
                            className="w-9 h-9 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center shadow-sm shadow-orange-200 hover:scale-110 active:scale-95"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-4 overflow-hidden">
              {/* Cart header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 rounded-lg">
                      <ShoppingCart className="w-4 h-4 text-orange-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Mon Panier</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    {cart.reduce((sum, c) => sum + c.quantity, 0)} article(s)
                  </span>
                </div>
              </div>

              <div className="p-5">
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ShoppingCart className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Panier vide</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">Ajoutez des plats pour commencer</p>
                  </div>
                ) : (
                  <>
                    {/* Cart items */}
                    <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.item_id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-xs">{item.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{formatCurrency(item.price)} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="flex items-center bg-white rounded-lg border border-gray-200">
                              <button onClick={() => updateQuantity(item.item_id, -1)}
                                className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-l-lg transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.item_id, 1)}
                                className="p-1 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-r-lg transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button onClick={() => removeFromCart(item.item_id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery */}
                    <div className="space-y-3 mb-4 pt-3 border-t border-gray-100">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          Lieu de livraison <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedLocation || ''}
                          onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
                          className={`w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-300 ${
                            !selectedLocation && deliveryLocations.length > 0 ? 'border-red-300' : 'border-gray-200'
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
                          <p className="text-[10px] text-red-600 mt-1 font-medium">
                            Aucun lieu configuré. Contactez votre gestionnaire.
                          </p>
                        ) : !selectedLocation && (
                          <p className="text-[10px] text-orange-500 mt-1 font-medium">
                            Veuillez sélectionner un lieu de livraison
                          </p>
                        )}
                      </div>

                      <input type="text" value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-300 placeholder:text-gray-400"
                        placeholder="Adresse complémentaire (optionnel)" />
                      <textarea value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-300 resize-none placeholder:text-gray-400"
                        placeholder="Notes (optionnel)" />
                    </div>

                    {/* Total + checkout */}
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-between mb-3">
                        <span className="text-sm font-bold text-gray-700">Total</span>
                        <span className="text-lg font-extrabold text-orange-600">{formatCurrency(getTotalAmount())}</span>
                      </div>

                      {getTotalAmount() > ticketBalance && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          <p className="text-[10px] text-red-700 font-medium">Solde insuffisant pour cette commande</p>
                        </div>
                      )}

                      {!selectedLocation && deliveryLocations.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 mb-3 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                          <p className="text-[10px] text-orange-700 font-medium">Sélectionnez un lieu de livraison</p>
                        </div>
                      )}

                      <button
                        onClick={handleCheckout}
                        disabled={getTotalAmount() > ticketBalance || !selectedLocation}
                        className="w-full bg-orange-500 text-white py-2.5 rounded-xl hover:bg-orange-600 transition-colors text-sm font-semibold disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-orange-200 disabled:shadow-none"
                      >
                        <Check className="w-4 h-4" />
                        Confirmer la commande
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrderSystem;
