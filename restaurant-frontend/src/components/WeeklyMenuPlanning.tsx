import React, { useState, useEffect } from 'react';
import { Calendar, Save, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { apiService, type WeeklyMenuPlanning, type MenuItem } from '../services/api';

const WeeklyMenuPlanning: React.FC = () => {
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
  };

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
          <div className={`rounded-xl shadow-2xl border-2 backdrop-blur-sm p-4 min-w-[320px] ${
            notification.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {notification.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-bold ${notification.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                  {notification.title}
                </h3>
                <p className={`mt-1 text-sm ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Planification Hebdomadaire</h1>
              <p className="text-sm text-gray-600">Définissez quels plats sont disponibles chaque jour de la semaine</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>

        {/* Feedback visuel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Compteur total de plats sélectionnés */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Plats sélectionnés</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {Object.values(selectedDishes).flat().length}
                </p>
              </div>
              <div className="p-3 bg-purple-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Statut de sauvegarde */}
          <div className={`border rounded-xl p-4 ${hasUnsavedChanges ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${hasUnsavedChanges ? 'text-orange-600' : 'text-green-600'}`}>
                  {hasUnsavedChanges ? 'Modifications non sauvegardées' : 'Sauvegardé'}
                </p>
                {lastSaved && !hasUnsavedChanges && (
                  <p className="text-xs text-green-700 mt-1">
                    {lastSaved.toLocaleDateString('fr-FR')} à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {hasUnsavedChanges && (
                  <p className="text-xs text-orange-700 mt-1">
                    Cliquez sur "Enregistrer"
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${hasUnsavedChanges ? 'bg-orange-200' : 'bg-green-200'}`}>
                {hasUnsavedChanges ? (
                  <XCircle className="w-6 h-6 text-orange-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
              </div>
            </div>
          </div>

          {/* Jours configurés */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Jours configurés</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {Object.values(selectedDishes).filter(arr => arr.length > 0).length} / 7
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {days.map(day => {
            const dayDishes = selectedDishes[day.key as keyof typeof selectedDishes];
            return (
              <div key={day.key} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <h3 className="text-lg font-bold text-gray-900">{day.label}</h3>
                    <span className="text-sm text-gray-600">({dayDishes.length} plat{dayDishes.length > 1 ? 's' : ''})</span>
                  </div>
                  <button
                    onClick={() => copyToAll(day.key)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Copier vers tous
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {menuItems.map(item => {
                    const isSelected = dayDishes.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleDish(day.key, item.id)}
                        className={`text-left p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-600">{item.category} - {item.price}F</p>
                          </div>
                          {isSelected && <CheckCircle className="w-5 h-5 text-orange-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {menuItems.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Aucun plat disponible. Créez d'abord des plats dans "Gestion du Menu".
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyMenuPlanning;
