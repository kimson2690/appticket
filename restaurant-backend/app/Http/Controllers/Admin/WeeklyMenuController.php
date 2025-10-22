<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class WeeklyMenuController extends Controller
{
    private $weeklyMenuFile = 'weekly_menu_planning.json';
    private $menuItemsFile = 'private/menu_items.json';

    /**
     * Récupérer la planification hebdomadaire
     */
    public function index(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');
            $userRole = $request->header('X-User-Role');

            Log::info('Récupération planification hebdo - Rôle: ' . $userRole . ', Restaurant ID: ' . $restaurantId);

            $planning = $this->loadWeeklyPlanning();

            // Filtrage par restaurant
            if ($userRole === 'Gestionnaire Restaurant' && $restaurantId) {
                $planning = array_filter($planning, function($plan) use ($restaurantId) {
                    return $plan['restaurant_id'] === $restaurantId;
                });
            }

            // S'il n'y a pas de planification, retourner une structure vide
            if (empty($planning)) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getEmptyWeekStructure($restaurantId)
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => array_values($planning)
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération planning: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Sauvegarder ou mettre à jour la planification hebdomadaire
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'restaurant_id' => 'nullable|string',
                'week_planning' => 'required|array',
                'week_planning.monday' => 'array',
                'week_planning.tuesday' => 'array',
                'week_planning.wednesday' => 'array',
                'week_planning.thursday' => 'array',
                'week_planning.friday' => 'array',
                'week_planning.saturday' => 'array',
                'week_planning.sunday' => 'array',
            ]);

            $restaurantId = $request->input('restaurant_id') ?? $request->header('X-User-Restaurant-Id');
            $createdBy = $request->header('X-User-Name') ?? 'Admin';

            if (!$restaurantId) {
                return response()->json(['error' => 'Restaurant ID manquant'], 400);
            }

            // Valider que tous les plats existent
            $menuItems = $this->loadMenuItems();
            $allItemIds = array_column($menuItems, 'id');

            foreach ($validated['week_planning'] as $day => $items) {
                foreach ($items as $itemId) {
                    if (!in_array($itemId, $allItemIds)) {
                        return response()->json([
                            'error' => "Plat non trouvé: $itemId"
                        ], 400);
                    }
                }
            }

            $plannings = $this->loadWeeklyPlanning();

            // Chercher si une planification existe déjà pour ce restaurant
            $existingIndex = null;
            foreach ($plannings as $index => $plan) {
                if ($plan['restaurant_id'] === $restaurantId) {
                    $existingIndex = $index;
                    break;
                }
            }

            $planningData = [
                'id' => $existingIndex !== null ? $plannings[$existingIndex]['id'] : 'weekly_' . time() . '_' . rand(1000, 9999),
                'restaurant_id' => $restaurantId,
                'week_planning' => $validated['week_planning'],
                'created_by' => $existingIndex !== null ? $plannings[$existingIndex]['created_by'] : $createdBy,
                'updated_by' => $createdBy,
                'created_at' => $existingIndex !== null ? $plannings[$existingIndex]['created_at'] : now()->toDateTimeString(),
                'updated_at' => now()->toDateTimeString(),
            ];

            if ($existingIndex !== null) {
                $plannings[$existingIndex] = $planningData;
                $message = 'Planification mise à jour avec succès';
            } else {
                $plannings[] = $planningData;
                $message = 'Planification créée avec succès';
            }

            $this->savePlanning($plannings);

            Log::info('Planification hebdo sauvegardée: ' . $restaurantId);

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $planningData
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Erreur de validation',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur sauvegarde planning: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer la planification avec les détails des plats
     */
    public function show(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');

            if (!$restaurantId) {
                // Si pas de restaurant_id, retourner une structure vide
                return response()->json([
                    'success' => true,
                    'data' => $this->getEmptyWeekStructure('default')
                ]);
            }

            $plannings = $this->loadWeeklyPlanning();
            $planning = null;

            foreach ($plannings as $plan) {
                if ($plan['restaurant_id'] === $restaurantId) {
                    $planning = $plan;
                    break;
                }
            }

            if (!$planning) {
                return response()->json([
                    'success' => true,
                    'data' => $this->getEmptyWeekStructure($restaurantId)
                ]);
            }

            // Enrichir avec les détails des plats
            $menuItems = $this->loadMenuItems();
            $enrichedPlanning = $planning;
            $enrichedPlanning['enriched_items'] = [];

            foreach ($planning['week_planning'] as $day => $itemIds) {
                $enrichedPlanning['enriched_items'][$day] = [];
                foreach ($itemIds as $itemId) {
                    $item = collect($menuItems)->firstWhere('id', $itemId);
                    if ($item) {
                        $enrichedPlanning['enriched_items'][$day][] = $item;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $enrichedPlanning
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération planning: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Structure vide pour la semaine
     */
    private function getEmptyWeekStructure($restaurantId)
    {
        return [
            'id' => 'weekly_new',
            'restaurant_id' => $restaurantId,
            'week_planning' => [
                'monday' => [],
                'tuesday' => [],
                'wednesday' => [],
                'thursday' => [],
                'friday' => [],
                'saturday' => [],
                'sunday' => []
            ],
            'enriched_items' => [
                'monday' => [],
                'tuesday' => [],
                'wednesday' => [],
                'thursday' => [],
                'friday' => [],
                'saturday' => [],
                'sunday' => []
            ],
            'created_at' => now()->toDateTimeString(),
            'updated_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Charger la planification hebdomadaire
     */
    private function loadWeeklyPlanning()
    {
        if (!Storage::disk('local')->exists($this->weeklyMenuFile)) {
            return [];
        }

        $content = Storage::disk('local')->get($this->weeklyMenuFile);
        return json_decode($content, true) ?? [];
    }

    /**
     * Charger les plats
     */
    private function loadMenuItems()
    {
        if (!Storage::disk('local')->exists($this->menuItemsFile)) {
            return [];
        }

        $content = Storage::disk('local')->get($this->menuItemsFile);
        return json_decode($content, true) ?? [];
    }

    /**
     * Sauvegarder la planification
     */
    private function savePlanning($plannings)
    {
        $json = json_encode($plannings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        if ($json === false) {
            Log::error('Erreur encodage JSON: ' . json_last_error_msg());
            throw new \Exception('Impossible d\'encoder les données en JSON');
        }
        
        Storage::disk('local')->put($this->weeklyMenuFile, $json);
    }
}
