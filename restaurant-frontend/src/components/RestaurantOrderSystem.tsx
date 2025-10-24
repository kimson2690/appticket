import React, { useState, useEffect } from 'react';
import {
  Store, ShoppingCart, Plus, Minus, Trash2, Check, X,
  ChefHat, Clock, MapPin, Star, Wallet, AlertCircle, CheckCircle
} from 'lucide-react';
import { apiService, type Restaurant, type MenuItem, type OrderItem } from '../services/api';

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
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error'; message: string} | null>(null);

  const baseUrl = 'http://localhost:8001/api';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': userId || '',
        'X-User-Name': userName || '',
      };

      // Charger restaurants
      const restaurantsRes = await fetch(`${baseUrl}/admin/restaurants`, { headers });
      const restaurantsData = await restaurantsRes.json();
      if (restaurantsData.success) {
        // Filtrer les restaurants actifs (status = 'active' OU is_active = true)
        setRestaurants(restaurantsData.data.filter((r: Restaurant) => 
          r.status === 'active' || r.is_active === true
        ));
      }

      // Charger plats
      const itemsRes = await fetch(`${baseUrl}/admin/menu-items`, { headers });
      const itemsData = await itemsRes.json();
      if (itemsData.success) {
        setMenuItems(itemsData.data.filter((item: MenuItem) => item.is_available));
      }

      // Charger solde
      const balanceRes = await fetch(`${baseUrl}/employee/ticket-balance`, { headers });
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setTicketBalance(balanceData.data.ticket_balance);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRestaurantMenus = (restaurantId: string) => {
    return menuItems.filter(item => item.restaurant_id === restaurantId);
  };

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    // Vérifier si on peut mélanger les restaurants
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
        setShowCheckout(false);
        setDeliveryAddress('');
        setNotes('');
        loadData(); // Recharger le solde
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
    <div className="min-h-screen bg-gray-50">
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

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Commander un Repas</h1>
              <p className="mt-1 text-gray-600">Choisissez votre restaurant et vos plats préférés</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-orange-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Solde</p>
                <p className="text-2xl font-bold text-orange-700">{formatCurrency(ticketBalance)}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCheckout(!showCheckout)}
                  className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 transition-colors relative"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des restaurants et menus */}
          <div className="lg:col-span-2 space-y-6">
            {restaurants.map((restaurant) => {
              const menus = getRestaurantMenus(restaurant.id);
              if (menus.length === 0) return null;

              return (
                <div key={restaurant.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* En-tête Restaurant */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Store className="w-6 h-6" />
                          <h2 className="text-2xl font-bold">{restaurant.name}</h2>
                        </div>
                        {restaurant.address && (
                          <div className="flex items-center space-x-2 text-orange-100 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">{restaurant.address}</span>
                          </div>
                        )}
                        {restaurant.cuisine_type && (
                          <div className="flex items-center space-x-2 text-orange-100">
                            <ChefHat className="w-4 h-4" />
                            <span className="text-sm">{restaurant.cuisine_type}</span>
                          </div>
                        )}
                      </div>
                      {restaurant.average_rating && (
                        <div className="flex items-center space-x-1 bg-white text-orange-600 px-3 py-1 rounded-full">
                          <Star className="w-4 h-4 fill-orange-500" />
                          <span className="font-bold">{restaurant.average_rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Menus du restaurant */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menus.map((item) => (
                      <div key={item.id} className="border rounded-lg overflow-hidden hover:border-orange-300 hover:shadow-md transition-all">
                        {/* Image du plat */}
                        {item.image_url && (
                          <div className="h-48 w-full overflow-hidden bg-gray-200">
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                            <span className="text-xl font-bold text-orange-600">{formatCurrency(item.price)}</span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                            <button
                              onClick={() => addToCart(item, restaurant)}
                              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Ajouter</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {restaurants.filter(r => getRestaurantMenus(r.id).length > 0).length === 0 && (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun menu disponible</h3>
                <p className="text-gray-500">Les restaurants n'ont pas encore publié leurs menus.</p>
              </div>
            )}
          </div>

          {/* Panier */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Panier</h3>
                <ShoppingCart className="w-6 h-6 text-orange-500" />
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Votre panier est vide</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.item_id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.item_id, -1)}
                              className="text-gray-600 hover:text-orange-600"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.item_id, 1)}
                              className="text-gray-600 hover:text-orange-600"
                            >
                              <Plus className="w-4 h-4" />
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

                  {showCheckout && (
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse de livraison (optionnel)
                        </label>
                        <input
                          type="text"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Ex: Bureau 201, Bât A"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (optionnel)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Préférences, allergies, etc."
                        />
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600">Sous-total</span>
                      <span className="font-semibold">{formatCurrency(getTotalAmount())}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4 text-lg font-bold">
                      <span>Total</span>
                      <span className="text-orange-600">{formatCurrency(getTotalAmount())}</span>
                    </div>

                    {getTotalAmount() > ticketBalance && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-800">
                          Solde insuffisant. Il manque {formatCurrency(getTotalAmount() - ticketBalance)}.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={getTotalAmount() > ticketBalance}
                      className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Check className="w-5 h-5" />
                      <span>Confirmer la commande</span>
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
