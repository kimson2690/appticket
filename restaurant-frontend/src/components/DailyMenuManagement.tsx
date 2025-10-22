import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, CheckCircle, XCircle, Eye, EyeOff, DollarSign, X } from 'lucide-react';
import { apiService, type DailyMenu, type MenuItem } from '../services/api';

interface DailyMenuForm {
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  day_of_week?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  valid_from: string;
  valid_until: string;
  price: number;
  items: Array<{ item_id: string; category: string; }>;
  is_available: boolean;
}

const DailyMenuManagement: React.FC = () => {
  const [menus, setMenus] = useState<DailyMenu[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<string | null>(null);
  const [editingMenu, setEditingMenu] = useState<DailyMenu | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string; title: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<{ item_id: string; category: string }>>([]);
  
  const [formData, setFormData] = useState<DailyMenuForm>({
    name: '',
    description: '',
    type: 'daily',
    day_of_week: undefined,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    price: 0,
    items: [],
    is_available: true,
  });

  const menuTypes = [
    { value: 'daily', label: 'Menu du jour' },
    { value: 'weekly', label: 'Menu de la semaine' },
    { value: 'special', label: 'Menu spécial' }
  ];

  const daysOfWeek = [
    { value: 'monday', label: 'Lundi' },
    { value: 'tuesday', label: 'Mardi' },
    { value: 'wednesday', label: 'Mercredi' },
    { value: 'thursday', label: 'Jeudi' },
    { value: 'friday', label: 'Vendredi' },
    { value: 'saturday', label: 'Samedi' },
    { value: 'sunday', label: 'Dimanche' }
  ];

  const categories = ['Entrée', 'Plat principal', 'Dessert', 'Boisson', 'Accompagnement'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [menusData, itemsData] = await Promise.all([
        apiService.getDailyMenus(),
        apiService.getMenuItems()
      ]);
      setMenus(menusData);
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', title: 'Erreur', message: 'Impossible de charger les données.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setNotification({ type: 'error', title: 'Plats manquants', message: 'Sélectionnez au moins un plat.' });
      return;
    }
    try {
      const restaurantId = localStorage.getItem('restaurantId') || localStorage.getItem('userRestaurantId') || '';
      const menuData = { ...formData, restaurant_id: restaurantId, items: selectedItems };
      
      if (editingMenu) {
        await apiService.updateDailyMenu(editingMenu.id, menuData);
        setNotification({ type: 'success', title: 'Menu mis à jour', message: 'Le menu a été mis à jour avec succès.' });
      } else {
        await apiService.createDailyMenu(menuData);
        setNotification({ type: 'success', title: 'Menu créé', message: 'Le menu a été créé avec succès.' });
      }
      setShowModal(false);
      setEditingMenu(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', title: 'Erreur', message: 'Une erreur est survenue.' });
    }
  };

  const handleEdit = (menu: DailyMenu) => {
    setEditingMenu(menu);
    setFormData({
      name: menu.name,
      description: menu.description,
      type: menu.type,
      day_of_week: menu.day_of_week,
      valid_from: menu.valid_from,
      valid_until: menu.valid_until,
      price: menu.price,
      items: menu.items,
      is_available: menu.is_available,
    });
    setSelectedItems(menu.items);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!menuToDelete) return;
    try {
      await apiService.deleteDailyMenu(menuToDelete);
      setNotification({ type: 'success', title: 'Menu supprimé', message: 'Le menu a été supprimé.' });
      setShowDeleteModal(false);
      setMenuToDelete(null);
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', title: 'Erreur', message: 'Impossible de supprimer le menu.' });
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      await apiService.toggleDailyMenuAvailability(id);
      setNotification({ type: 'info', title: 'Disponibilité modifiée', message: 'La disponibilité a été mise à jour.' });
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const toggleItemSelection = (itemId: string, category: string) => {
    const exists = selectedItems.find(item => item.item_id === itemId);
    if (exists) {
      setSelectedItems(selectedItems.filter(item => item.item_id !== itemId));
    } else {
      setSelectedItems([...selectedItems, { item_id: itemId, category }]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'daily',
      day_of_week: undefined,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 0,
      items: [],
      is_available: true,
    });
    setSelectedItems([]);
  };

  const filteredMenus = menus.filter(menu => {
    const matchesSearch = menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          menu.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || menu.type === selectedType;
    return matchesSearch && matchesType;
  });

  const availableMenus = menus.filter(menu => menu.is_available).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className={\`rounded-xl shadow-2xl border-2 backdrop-blur-sm p-4 min-w-[320px] \${
            notification.type === 'success' ? 'bg-green-50 border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
          }\`}>
            <div className="flex items-start">
              <div className={\`flex-shrink-0 \${notification.type === 'success' ? 'text-green-600' : notification.type === 'error' ? 'text-red-600' : 'text-blue-600'}\`}>
                {notification.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div className="ml-3 flex-1">
                <h3 className={\`text-sm font-bold \${notification.type === 'success' ? 'text-green-900' : notification.type === 'error' ? 'text-red-900' : 'text-blue-900'}\`}>
                  {notification.title}
                </h3>
                <p className={\`mt-1 text-sm \${notification.type === 'success' ? 'text-green-700' : notification.type === 'error' ? 'text-red-700' : 'text-blue-700'}\`}>
                  {notification.message}
                </p>
              </div>
              <button onClick={() => setNotification(null)} className="ml-4 flex-shrink-0"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-xl"><Calendar className="w-6 h-6 text-orange-600" /></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Menus Composés</h1>
              <p className="text-sm text-gray-600">Gérez vos menus du jour et de la semaine</p>
            </div>
          </div>
          <button onClick={() => { setEditingMenu(null); resetForm(); setShowModal(true); }}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            <Plus className="w-5 h-5" /><span>Nouveau Menu</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-blue-700">Total Menus</p><p className="text-2xl font-bold text-blue-900 mt-1">{menus.length}</p></div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-green-700">Disponibles</p><p className="text-2xl font-bold text-green-900 mt-1">{availableMenus}</p></div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium text-orange-700">Prix Moyen</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{menus.length > 0 ? Math.round(menus.reduce((sum, m) => sum + m.price, 0) / menus.length) : 0}F</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Rechercher un menu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          </div>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            <option value="all">Tous les types</option>
            {menuTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenus.map((menu) => (
          <div key={menu.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{menu.name}</h3>
                  <p className="text-sm text-orange-600 font-medium">{menuTypes.find(t => t.value === menu.type)?.label}</p>
                </div>
                <div className={\`px-3 py-1 rounded-full text-xs font-medium \${menu.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}\`}>
                  {menu.is_available ? 'Disponible' : 'Indisponible'}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{menu.description}</p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(menu.valid_from).toLocaleDateString('fr-FR')} - {new Date(menu.valid_until).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center text-sm font-bold text-orange-600">
                  <DollarSign className="w-4 h-4 mr-2" /><span>{menu.price}F</span>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Composition ({menu.items.length} plats):</p>
                <div className="flex flex-wrap gap-1">
                  {menu.items.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{item.category}</span>
                  ))}
                  {menu.items.length > 3 && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">+{menu.items.length - 3}</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                <button onClick={() => toggleAvailability(menu.id)}
                  className={\`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors \${
                    menu.is_available ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}\`}>
                  {menu.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span className="text-sm">{menu.is_available ? 'Masquer' : 'Afficher'}</span>
                </button>
                <button onClick={() => handleEdit(menu)} className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => { setMenuToDelete(menu.id); setShowDeleteModal(true); }}
                  className="flex items-center justify-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMenus.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun menu trouvé</h3>
          <p className="text-gray-600">{searchTerm || selectedType !== 'all' ? 'Modifiez vos critères de recherche.' : 'Créez votre premier menu composé.'}</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">{editingMenu ? 'Modifier le menu' : 'Nouveau menu composé'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Informations générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom du menu *</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Menu du Chef" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                    <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                      {menuTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" placeholder="Décrivez le menu..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {formData.type === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jour</label>
                      <select value={formData.day_of_week || ''} onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
                        <option value="">Sélectionner</option>
                        {daysOfWeek.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valide du *</label>
                    <input type="date" required value={formData.valid_from} onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valide jusqu'au *</label>
                    <input type="date" required value={formData.valid_until} min={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prix (F CFA) *</label>
                    <input type="number" required min="0" step="100" value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Composition ({selectedItems.length} plat{selectedItems.length > 1 ? 's' : ''})</h3>
                {categories.map(category => {
                  const categoryItems = menuItems.filter(item => item.category === category && item.is_available);
                  if (categoryItems.length === 0) return null;
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-3">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryItems.map(item => {
                          const isSelected = selectedItems.some(si => si.item_id === item.id);
                          return (
                            <button key={item.id} type="button" onClick={() => toggleItemSelection(item.id, category)}
                              className={\`text-left p-3 rounded-lg border-2 transition-all \${isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}\`}>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.name}</p>
                                  <p className="text-sm text-gray-600">{item.price}F</p>
                                </div>
                                {isSelected && <CheckCircle className="w-5 h-5 text-orange-600" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="available" checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                <label htmlFor="available" className="ml-2 text-sm font-medium text-gray-700">Menu disponible immédiatement</label>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => { setShowModal(false); setEditingMenu(null); resetForm(); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  {editingMenu ? 'Mettre à jour' : 'Créer le menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full"><Trash2 className="w-6 h-6 text-red-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer ce menu ? Cette action est irréversible.</p>
            <div className="flex items-center justify-end space-x-3">
              <button onClick={() => { setShowDeleteModal(false); setMenuToDelete(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyMenuManagement;
