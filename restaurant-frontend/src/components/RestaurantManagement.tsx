import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Utensils, 
  Star, 
  MapPin,
  Phone,
  Mail,
  Users,
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  X,
  Globe,
  Clock,
  Truck,
  ShoppingCart,
  FileText,
  CheckCircle2,
  ShieldAlert,
  ChefHat
} from 'lucide-react';
import { apiService, type Restaurant } from '../services/api';

const RestaurantManagement: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Burkina Faso',
    cuisine_type: '',
    description: '',
    website: '',
    opening_hours: '',
    delivery_fee: 0,
    minimum_order: 0,
    status: 'active' as 'active' | 'inactive' | 'suspended',
    is_partner: true,
    commission_rate: 15
  });

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      const restaurantsData = await apiService.getRestaurants();
      setRestaurants(restaurantsData);
    } catch (err) {
      setError('Erreur lors du chargement des restaurants');
      console.error('Error loading restaurants:', err);
      // Fallback avec des données par défaut
      setRestaurants([
        {
          id: '1',
          name: 'Chez Aminata',
          email: 'contact@chezaminata.bf',
          phone: '+226 25 30 45 67',
          address: 'Avenue Kwame Nkrumah, Secteur 4',
          city: 'Ouagadougou',
          postal_code: '01 BP 1234',
          country: 'Burkina Faso',
          cuisine_type: 'Burkinabé, Africaine',
          description: 'Restaurant traditionnel burkinabé avec spécialités locales et cuisine africaine',
          website: 'https://chezaminata.bf',
          opening_hours: '11h00 - 23h00',
          delivery_fee: 1000,
          minimum_order: 3000,
          average_rating: 4.5,
          total_reviews: 127,
          status: 'active',
          is_partner: true,
          commission_rate: 15,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = () => {
    setSelectedRestaurant(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'Burkina Faso',
      cuisine_type: '',
      description: '',
      website: '',
      opening_hours: '',
      delivery_fee: 0,
      minimum_order: 0,
      status: 'active',
      is_partner: true,
      commission_rate: 15
    });
    setSelectedCuisines([]);
    setShowModal(true);
  };

  const handleEditRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      email: restaurant.email,
      phone: restaurant.phone,
      address: restaurant.address,
      city: restaurant.city || '',
      postal_code: restaurant.postal_code || '',
      country: restaurant.country || 'Burkina Faso',
      cuisine_type: restaurant.cuisine_type,
      description: restaurant.description || '',
      website: restaurant.website || '',
      opening_hours: restaurant.opening_hours || '',
      delivery_fee: restaurant.delivery_fee ?? 0,
      minimum_order: restaurant.minimum_order ?? 0,
      status: restaurant.status ?? 'active',
      is_partner: restaurant.is_partner ?? true,
      commission_rate: restaurant.commission_rate ?? 15
    });
    // Convertir la chaîne de cuisine en tableau pour l'édition
    setSelectedCuisines(restaurant.cuisine_type ? restaurant.cuisine_type.split(', ') : []);
    setShowModal(true);
  };

  const handleDeleteRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convertir le tableau de cuisines en chaîne
    const cuisineString = selectedCuisines.join(', ');
    const updatedFormData = { ...formData, cuisine_type: cuisineString };
    
    try {
      if (selectedRestaurant) {
        // Modifier un restaurant existant via l'API
        const updatedRestaurant = await apiService.updateRestaurant(selectedRestaurant.id, updatedFormData);
        setRestaurants(restaurants.map(restaurant => 
          restaurant.id === selectedRestaurant.id ? updatedRestaurant : restaurant
        ));
      } else {
        // Créer un nouveau restaurant via l'API
        const newRestaurant = await apiService.createRestaurant(updatedFormData);
        setRestaurants([...restaurants, newRestaurant]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // En cas d'erreur API, utiliser la logique locale comme fallback
      if (selectedRestaurant) {
        // Modifier un restaurant existant (fallback local)
        setRestaurants(restaurants.map(restaurant => 
          restaurant.id === selectedRestaurant.id 
            ? { ...restaurant, ...updatedFormData, updated_at: new Date().toISOString().split('T')[0] }
            : restaurant
        ));
      } else {
        // Créer un nouveau restaurant (fallback local)
        const newRestaurant: Restaurant = {
          id: Date.now().toString(),
          ...updatedFormData,
          average_rating: 0,
          total_reviews: 0,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0]
        };
        setRestaurants([...restaurants, newRestaurant]);
      }
      setShowModal(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedRestaurant) {
      try {
        // Supprimer via l'API
        await apiService.deleteRestaurant(selectedRestaurant.id);
        setRestaurants(restaurants.filter(restaurant => restaurant.id !== selectedRestaurant.id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        // En cas d'erreur API, supprimer localement comme fallback
        setRestaurants(restaurants.filter(restaurant => restaurant.id !== selectedRestaurant.id));
      }
    }
    setShowDeleteModal(false);
    setSelectedRestaurant(null);
  };

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine) 
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Restaurants</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez les restaurants partenaires et leurs informations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{dateStr}</span>
          </div>
          <button
            onClick={handleCreateRestaurant}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100"
          >
            <Plus className="w-4 h-4" />
            Nouveau Restaurant
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Restaurants', value: restaurants.length, icon: Utensils, color: 'bg-orange-50 text-orange-600' },
          { label: 'Restaurants Actifs', value: restaurants.filter(r => r.status === 'active').length, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Note Moyenne', value: restaurants.length > 0 ? (restaurants.reduce((sum, r) => sum + (r.average_rating || 0), 0) / restaurants.length).toFixed(1) : '0.0', icon: Star, color: 'bg-amber-50 text-amber-600', isText: true },
          { label: 'Partenaires', value: restaurants.filter(r => r.is_partner).length, icon: Users, color: 'bg-blue-50 text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`mt-1 font-extrabold ${(s as any).isText ? 'text-2xl text-amber-600' : 'text-3xl text-gray-900'}`}>{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${s.color} group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Liste des Restaurants</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Restaurant</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cuisine</th>
                <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Utensils className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Aucun restaurant trouvé</p>
                  </td>
                </tr>
              ) : (
                restaurants.map((restaurant, idx) => (
                  <tr key={restaurant.id} className={`hover:bg-orange-50/30 transition-colors ${idx !== restaurants.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Utensils className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{restaurant.name}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span>{restaurant.city}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{restaurant.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span>{restaurant.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border bg-blue-50 border-blue-200 text-blue-700">
                        {restaurant.cuisine_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        restaurant.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        restaurant.status === 'inactive' ? 'bg-gray-50 border-gray-200 text-gray-600' :
                        'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          restaurant.status === 'active' ? 'bg-emerald-400' :
                          restaurant.status === 'inactive' ? 'bg-gray-400' : 'bg-red-400'
                        }`}></span>
                        {restaurant.status === 'active' ? 'Actif' :
                         restaurant.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEditRestaurant(restaurant)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteRestaurant(restaurant)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                    {selectedRestaurant ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedRestaurant ? 'Modifier le Restaurant' : 'Nouveau Restaurant'}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Remplissez les informations du restaurant</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Utensils className="w-3.5 h-3.5 text-orange-500" />
                    Nom du restaurant <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="Ex: Chez Aminata" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Mail className="w-3.5 h-3.5 text-orange-500" />
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="contact@restaurant.bf" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Phone className="w-3.5 h-3.5 text-orange-500" />
                    Téléphone <span className="text-red-400">*</span>
                  </label>
                  <input type="tel" required value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="+226 25 30 45 67" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <ChefHat className="w-3.5 h-3.5 text-orange-500" />
                    Types de cuisine <span className="text-red-400">*</span>
                  </label>
                  <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-2.5 max-h-40 overflow-y-auto transition-all hover:border-gray-200">
                    {[
                      'Sénégalaise', 'Burkinabé', 'Africaine', 'Française',
                      'Italienne', 'Libanaise', 'Chinoise', 'Grillades',
                      'Fast Food', 'Végétarienne', 'Marocaine', 'Indienne'
                    ].map((cuisine) => (
                      <label key={cuisine} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-orange-50/50 rounded-lg px-2">
                        <input type="checkbox" checked={selectedCuisines.includes(cuisine)}
                          onChange={() => handleCuisineToggle(cuisine)}
                          className="w-3.5 h-3.5 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2" />
                        <span className="text-xs text-gray-700">{cuisine}</span>
                      </label>
                    ))}
                  </div>
                  {selectedCuisines.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedCuisines.map((cuisine) => (
                        <span key={cuisine}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-orange-50 border border-orange-200 text-orange-700">
                          {cuisine}
                          <button type="button" onClick={() => handleCuisineToggle(cuisine)}
                            className="text-orange-400 hover:text-orange-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    Adresse <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="Avenue Kwame Nkrumah, Secteur 4" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    Ville <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="Ouagadougou" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Globe className="w-3.5 h-3.5 text-orange-500" />
                    Pays <span className="text-red-400">*</span>
                  </label>
                  <select required value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 appearance-none cursor-pointer">
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Mali">Mali</option>
                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Niger">Niger</option>
                    <option value="Togo">Togo</option>
                    <option value="Bénin">Bénin</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Globe className="w-3.5 h-3.5 text-orange-500" />
                    Site web
                  </label>
                  <input type="url" value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="https://restaurant.bf" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    Horaires d'ouverture
                  </label>
                  <input type="text" value={formData.opening_hours}
                    onChange={(e) => setFormData({ ...formData, opening_hours: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="11h00 - 23h00" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Truck className="w-3.5 h-3.5 text-orange-500" />
                    Frais de livraison (FCFA)
                  </label>
                  <input type="number" min="0" value={formData.delivery_fee}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="1000" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <ShoppingCart className="w-3.5 h-3.5 text-orange-500" />
                    Commande minimum (FCFA)
                  </label>
                  <input type="number" min="0" value={formData.minimum_order}
                    onChange={(e) => setFormData({ ...formData, minimum_order: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="3000" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                    Statut
                  </label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 appearance-none cursor-pointer">
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    Description
                  </label>
                  <textarea value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 resize-none"
                    placeholder="Description du restaurant..." />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedRestaurant ? 'Enregistrer' : 'Créer le restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}
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
                    <h3 className="text-lg font-bold text-gray-900">Supprimer le Restaurant</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible</p>
                  </div>
                </div>
                <button onClick={() => setShowDeleteModal(false)}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir supprimer <span className="font-bold text-gray-900">"{selectedRestaurant.name}"</span> ?
                </p>
                <p className="text-xs text-gray-500 mt-2">Toutes les données associées seront supprimées.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Annuler
                </button>
                <button onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-rose-600 transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 flex items-center justify-center gap-2">
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

export default RestaurantManagement;
