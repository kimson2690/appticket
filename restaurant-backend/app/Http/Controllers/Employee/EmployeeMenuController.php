<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EmployeeMenuController extends Controller
{
    private $menuItemsFile = 'menu_items.json';
    private $weeklyPlanningFile = 'weekly_menu_planning.json';

    /**
     * Récupérer les plats disponibles pour le jour actuel
     */
    public function getAvailableMenuItems(Request $request)
    {
        try {
            $companyId = $request->header('X-User-Company-Id');
            
            if (!$companyId) {
                Log::warning('Company ID manquant pour récupération des plats');
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Récupérer le jour actuel (en anglais lowercase)
            $currentDay = strtolower(date('l')); // monday, tuesday, etc.
            
            Log::info("Récupération plats pour le jour: $currentDay");

            // Charger tous les plats disponibles
            $menuItems = $this->loadMenuItems();
            
            // Charger les planifications hebdomadaires
            $weeklyPlannings = $this->loadWeeklyPlannings();
            
            // Filtrer les plats selon:
            // 1. Le plat doit être disponible (is_available = true)
            // 2. Le restaurant doit avoir une planification pour aujourd'hui
            $availableItems = [];
            
            foreach ($menuItems as $item) {
                // Vérifier si le plat est disponible
                if (!isset($item['is_available']) || !$item['is_available']) {
                    continue;
                }
                
                $restaurantId = $item['restaurant_id'] ?? '';
                
                // Chercher la planification hebdomadaire du restaurant
                $planning = $this->findPlanningByRestaurant($weeklyPlannings, $restaurantId);
                
                if ($planning && isset($planning['week_planning'][$currentDay])) {
                    $todayDishes = $planning['week_planning'][$currentDay];
                    
                    // Vérifier si ce plat est dans la planification du jour
                    if (in_array($item['id'], $todayDishes)) {
                        $availableItems[] = $item;
                        Log::info("Plat disponible aujourd'hui: " . $item['name'] . " (Restaurant: $restaurantId)");
                    }
                }
            }
            
            Log::info("Nombre total de plats disponibles aujourd'hui ($currentDay): " . count($availableItems));

            return response()->json([
                'success' => true,
                'data' => $availableItems,
                'current_day' => $currentDay
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des plats du jour: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Charger les plats depuis le fichier JSON
     */
    private function loadMenuItems()
    {
        if (!Storage::exists($this->menuItemsFile)) {
            return [];
        }

        $content = Storage::get($this->menuItemsFile);
        return json_decode($content, true) ?? [];
    }

    /**
     * Charger les planifications hebdomadaires depuis le fichier JSON
     */
    private function loadWeeklyPlannings()
    {
        if (!Storage::exists($this->weeklyPlanningFile)) {
            Log::warning("Fichier de planification hebdomadaire non trouvé: {$this->weeklyPlanningFile}");
            return [];
        }

        $content = Storage::get($this->weeklyPlanningFile);
        return json_decode($content, true) ?? [];
    }

    /**
     * Trouver la planification d'un restaurant spécifique
     */
    private function findPlanningByRestaurant($plannings, $restaurantId)
    {
        foreach ($plannings as $planning) {
            if (isset($planning['restaurant_id']) && $planning['restaurant_id'] === $restaurantId) {
                return $planning;
            }
        }
        return null;
    }
}
