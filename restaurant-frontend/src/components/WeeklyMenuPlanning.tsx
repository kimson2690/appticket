import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle, RefreshCw, CalendarDays, Copy, ChefHat, X as XIcon } from 'lucide-react';
import { apiService, type WeeklyMenuPlanning, type MenuItem } from '../services/api';

const WeeklyMenuPlanningComponent: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [planning, setPlanning] = useState<WeeklyMenuPlanning | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; title: string } | null>(null);
  const [savedDishes, setSavedDishes] = useState<typeof selectedDishes>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<{
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  }>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });

  const days = [
    { key: 'monday', label: 'Lundi', color: 'blue' },
    { key: 'tuesday', label: 'Mardi', color: 'green' },
    { key: 'wednesday', label: 'Mercredi', color: 'purple' },
    { key: 'thursday', label: 'Jeudi', color: 'yellow' },
    { key: 'friday', label: 'Vendredi', color: 'pink' },
    { key: 'saturday', label: 'Samedi', color: 'indigo' },
    { key: 'sunday', label: 'Dimanche', color: 'orange' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    console.log('📋 selectedDishes mis à jour:', selectedDishes);
    console.log('Lundi:', selectedDishes.monday);
    console.log('Mardi:', selectedDishes.tuesday);
  }, [selectedDishes]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('=== DÉBUT CHARGEMENT PLANNING HEBDO ===');
      
      const [planningData, itemsData] = await Promise.all([
        apiService.getWeeklyMenuPlanning(),
        apiService.getMenuItems()
      ]);
      
      console.log('Planning reçu du backend:', planningData);
      console.log('Type de planningData:', typeof planningData);
      console.log('planningData.week_planning:', planningData?.week_planning);
      
      setPlanning(planningData);
      setMenuItems(itemsData.filter(item => item.is_available));
      
      if (planningData && planningData.week_planning) {
        console.log('✅ Week planning trouvé, mise à jour des plats sélectionnés');
        console.log('Plats sélectionnés:', planningData.week_planning);
        setSelectedDishes(planningData.week_planning);
        setSavedDishes(planningData.week_planning);
        setHasUnsavedChanges(false);
        if (planningData.updated_at) {
          setLastSaved(new Date(planningData.updated_at));
        }
      } else {
        console.log('❌ Pas de week_planning dans les données reçues');
        console.log('Structure de planningData:', Object.keys(planningData || {}));
      }
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', title: 'Erreur', message: 'Impossible de charger les données.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDish = (day: string, dishId: string) => {
    setSelectedDishes(prev => {
      const dayDishes = prev[day as keyof typeof prev];
      const isSelected = dayDishes.includes(dishId);
      
      const newSelection = {
        ...prev,
        [day]: isSelected 
          ? dayDishes.filter(id => id !== dishId)
          : [...dayDishes, dishId]
      };
      
      // Vérifier s'il y a des changements non sauvegardés
      const hasChanges = JSON.stringify(newSelection) !== JSON.stringify(savedDishes);
      setHasUnsavedChanges(hasChanges);
      
      return newSelection;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const restaurantId = localStorage.getItem('restaurantId') || localStorage.getItem('userRestaurantId') || '';
      
      await apiService.saveWeeklyMenuPlanning({
        restaurant_id: restaurantId,
        week_planning: selectedDishes
      });
      
      setNotification({ type: 'success', title: 'Enregistré', message: 'Votre planification hebdomadaire a été sauvegardée avec succès.' });
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      loadData();
    } catch (error) {
      console.error('Erreur:', error);
      setNotification({ type: 'error', title: 'Erreur', message: 'Une erreur est survenue lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  const copyToAll = (day: string) => {
    const dayDishes = selectedDishes[day as keyof typeof selectedDishes];
    const newPlanning = {} as typeof selectedDishes;
    days.forEach(d => {
      newPlanning[d.key as keyof typeof selectedDishes] = [...dayDishes];
    });
    setSelectedDishes(newPlanning);
    setHasUnsavedChanges(true);
  };

  const totalSelected = Object.values(selectedDishes).flat().length;
  const configuredDays = Object.values(selectedDishes).filter(arr => arr.length > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement du planning...</p>
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
            notification.type === 'success' ? 'bg-emerald-50/95 border-emerald-200' : 'bg-red-50/95 border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <div className="p-1.5 bg-emerald-100 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-600" /></div>
            ) : (
              <div className="p-1.5 bg-red-100 rounded-lg"><XCircle className="w-4 h-4 text-red-600" /></div>
            )}
            <div>
              <p className={`text-sm font-semibold ${notification.type === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>{notification.title}</p>
              <p className={`text-xs ${notification.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>{notification.message}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Planification Hebdomadaire</h1>
          <p className="text-sm text-gray-400 mt-0.5">Définissez quels plats sont disponibles chaque jour de la semaine</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
            hasUnsavedChanges
              ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-100'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Plats sélectionnés */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Plats sélectionnés</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{totalSelected}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Statut sauvegarde */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">
                {hasUnsavedChanges ? 'Non sauvegardé' : 'Sauvegardé'}
              </p>
              {lastSaved && !hasUnsavedChanges ? (
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {lastSaved.toLocaleDateString('fr-FR')} à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              ) : hasUnsavedChanges ? (
                <p className="text-sm font-semibold text-amber-600 mt-1">Modifications en attente</p>
              ) : (
                <p className="text-sm font-semibold text-gray-900 mt-1">À jour</p>
              )}
            </div>
            <div className={`p-2.5 rounded-xl group-hover:scale-110 transition-transform ${
              hasUnsavedChanges ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {hasUnsavedChanges ? <RefreshCw className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Jours configurés */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">Jours configurés</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-1">{configuredDays} <span className="text-lg font-bold text-gray-400">/ 7</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Day Sections */}
      <div className="space-y-4">
        {days.map(day => {
          const dayDishes = selectedDishes[day.key as keyof typeof selectedDishes];
          const selectedCount = dayDishes.length;

          return (
            <div key={day.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-orange-200 transition-all">
              {/* Day Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                  <h3 className="text-base font-bold text-gray-900">{day.label}</h3>
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                    {selectedCount} plat{selectedCount > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => copyToAll(day.key)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copier vers tous
                </button>
              </div>

              {/* Dishes Grid */}
              <div className="p-4">
                {menuItems.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <ChefHat className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Aucun plat disponible</p>
                    <p className="text-xs text-gray-300 mt-0.5">Créez d'abord des plats dans "Gestion du Menu"</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {menuItems.map(item => {
                      const isSelected = dayDishes.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleDish(day.key, item.id)}
                          className={`text-left p-3.5 rounded-xl border-2 transition-all group/dish ${
                            isSelected
                              ? 'border-orange-400 bg-orange-50/70 shadow-sm shadow-orange-100'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{item.category} - {item.price}F</p>
                            </div>
                            <div className={`ml-3 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-300 group-hover/dish:bg-gray-200 group-hover/dish:text-gray-400'
                            }`}>
                              <CheckCircle className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyMenuPlanningComponent;
