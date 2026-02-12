import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ChefHat, CheckCircle, XCircle, Eye, EyeOff, Clock, Upload, X as XIcon, CalendarDays, ChevronDown, Filter } from 'lucide-react';
import { apiService, type MenuItem } from '../services/api';

interface MenuItemForm {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  preparation_time?: number;
  allergens: string[];
  ingredients: string[];
}

const MenuManagement: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; title: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<MenuItemForm>({
    name: '',
    description: '',
    price: 0,
    category: '',
    image_url: '',
    is_available: true,
    preparation_time: undefined,
    allergens: [],
    ingredients: [],
  });

  const categories = ['Entrées', 'Plats principaux', 'Desserts', 'Boissons', 'Accompagnements'];

  useEffect(() => {
    loadMenuItems();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMenuItems();
      setMenuItems(data);
    } catch (error) {
      console.error('Erreur lors du chargement des plats:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les plats.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiService.updateMenuItem(editingItem.id, formData);
        setNotification({
          type: 'success',
          title: 'Plat mis à jour',
          message: 'Le plat a été mis à jour avec succès.'
        });
      } else {
        // Récupérer le restaurant_id du localStorage ou utiliser une valeur par défaut
        const restaurantId = localStorage.getItem('restaurantId') || 
                             localStorage.getItem('userRestaurantId') || 
                             '';
        await apiService.createMenuItem({
          restaurant_id: restaurantId,
          ...formData
        });
        setNotification({
          type: 'success',
          title: 'Plat ajouté',
          message: 'Le plat a été ajouté au menu avec succès.'
        });
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      loadMenuItems();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de sauvegarde',
        message: 'Une erreur est survenue lors de la sauvegarde du plat.'
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.image_url,
      is_available: item.is_available,
      preparation_time: item.preparation_time,
      allergens: item.allergens || [],
      ingredients: item.ingredients || [],
    });
    setImagePreview(item.image_url || null);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await apiService.deleteMenuItem(itemToDelete);
      setNotification({
        type: 'success',
        title: 'Plat supprimé',
        message: 'Le plat a été supprimé avec succès.'
      });
      setShowDeleteModal(false);
      setItemToDelete(null);
      loadMenuItems();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setNotification({
        type: 'error',
        title: 'Erreur de suppression',
        message: 'Une erreur est survenue lors de la suppression du plat.'
      });
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      await apiService.toggleMenuItemAvailability(id);
      setNotification({
        type: 'info',
        title: 'Disponibilité modifiée',
        message: 'La disponibilité du plat a été mise à jour.'
      });
      loadMenuItems();
    } catch (error) {
      console.error('Erreur lors du changement de disponibilité:', error);
      setNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue.'
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type
    if (!file.type.startsWith('image/')) {
      setNotification({
        type: 'error',
        title: 'Type de fichier invalide',
        message: 'Veuillez sélectionner une image (PNG, JPG, etc.)'
      });
      return;
    }

    // Validation de la taille (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setNotification({
        type: 'error',
        title: 'Fichier trop volumineux',
        message: 'La taille de l\'image ne doit pas dépasser 2MB'
      });
      return;
    }

    // Conversion en base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, image_url: base64String });
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
    setImagePreview(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: '',
      image_url: '',
      is_available: true,
      preparation_time: undefined,
      allergens: [],
      ingredients: [],
    });
    setImagePreview(null);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableItems = menuItems.filter(item => item.is_available).length;
  const unavailableItems = menuItems.length - availableItems;

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`rounded-2xl shadow-lg border p-4 flex items-center gap-3 backdrop-blur-sm ${
            notification.type === 'success' ? 'bg-emerald-50/95 border-emerald-200' :
            notification.type === 'error' ? 'bg-red-50/95 border-red-200' :
            'bg-blue-50/95 border-blue-200'
          }`}>
            {notification.type === 'success' ? (
              <div className="p-1.5 bg-emerald-100 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
            ) : notification.type === 'error' ? (
              <div className="p-1.5 bg-red-100 rounded-lg"><XCircle className="w-4 h-4 text-red-600" /></div>
            ) : (
              <div className="p-1.5 bg-blue-100 rounded-lg"><CheckCircle className="w-4 h-4 text-blue-600" /></div>
            )}
            <div>
              <p className={`text-sm font-semibold ${notification.type === 'success' ? 'text-emerald-900' : notification.type === 'error' ? 'text-red-900' : 'text-blue-900'}`}>{notification.title}</p>
              <p className={`text-xs ${notification.type === 'success' ? 'text-emerald-700' : notification.type === 'error' ? 'text-red-700' : 'text-blue-700'}`}>{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors ml-2">
              <XIcon className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion du Menu</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez les plats disponibles dans votre restaurant</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{dateStr}</span>
          </div>
          <button
            onClick={() => { setEditingItem(null); resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100"
          >
            <Plus className="w-4 h-4" />
            Nouveau Plat
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { label: 'Total Plats', value: menuItems.length, icon: ChefHat, color: 'bg-blue-50 text-blue-600' },
          { label: 'Disponibles', value: availableItems, icon: Eye, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Indisponibles', value: unavailableItems, icon: EyeOff, color: 'bg-gray-100 text-gray-500' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${s.color} group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un plat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300 shadow-sm placeholder:text-gray-400"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-300 shadow-sm cursor-pointer"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Liste des plats */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun plat trouvé</h3>
          <p className="text-sm text-gray-400">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Essayez de modifier vos critères de recherche.' 
              : 'Commencez par ajouter un plat à votre menu.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-orange-200 transition-all group">
              {/* Image */}
              <div className="h-44 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center relative overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <ChefHat className="w-14 h-14 text-orange-200" />
                )}
                <div className={`absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm ${
                  item.is_available 
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-700' 
                    : 'bg-gray-50/90 border-gray-200 text-gray-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.is_available ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                  {item.is_available ? 'Disponible' : 'Indisponible'}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">{item.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-lg font-extrabold text-orange-600">{item.price}F</p>
                    {item.preparation_time && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 justify-end mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{item.preparation_time}min</span>
                      </div>
                    )}
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
                )}

                {item.allergens && item.allergens.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {item.allergens.map((allergen, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-md font-medium border border-red-100">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      item.is_available
                        ? 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {item.is_available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {item.is_available ? 'Masquer' : 'Afficher'}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setItemToDelete(item.id); setShowDeleteModal(true); }}
                    className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajout/Modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {editingItem ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{editingItem ? 'Modifier le plat' : 'Nouveau plat'}</h2>
                  <p className="text-sm text-orange-100">Remplissez les informations du plat</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du plat *</label>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="Ex: Poulet Yassa" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie *</label>
                  <select required value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300">
                    <option value="">Sélectionner</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300 resize-none"
                  placeholder="Décrivez le plat..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix (F CFA) *</label>
                  <input type="number" required min="0" step="100" value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Temps de préparation (min)</label>
                  <input type="number" min="0" value={formData.preparation_time || ''}
                    onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo du plat</label>
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <Upload className="w-8 h-8 text-gray-300 mb-1.5" />
                    <p className="text-xs text-gray-500"><span className="font-semibold text-gray-600">Cliquez</span> ou glissez-déposez</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG (max. 2MB)</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-40 object-cover rounded-xl" />
                    <button type="button" onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="available" checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                <label htmlFor="available" className="text-sm font-medium text-gray-700">Disponible immédiatement</label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button"
                  onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                  {editingItem ? 'Mettre à jour' : 'Ajouter le plat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Supprimer le plat</h3>
                  <p className="text-sm text-red-100">Cette action est irréversible</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-5">
                Êtes-vous sûr de vouloir supprimer ce plat ? Il ne sera plus visible dans le menu.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
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

export default MenuManagement;
