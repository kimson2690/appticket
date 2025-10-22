<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class WeeklyMenuController extends Controller
{
    private $weeklyMenuFile = 'weekly_menu_planning.json';
    private $menuItemsFile = 'menu_items.json';

    /**
     * Récupérer la planification hebdomadaire
     */
    public function index(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');
            $userRole = $request->header('X-User-Role');

            Log::info('Récupération planification hebdo - Rôle: ' . $userRole . ', Restaurant ID: ' . $restaurantId);

            $plannings = $this->loadWeeklyPlanning();
            Log::info('Planifications chargées: ' . count($plannings));
            Log::info('Première planification:', $plannings[0] ?? []);

            // Si pas de restaurant_id, utiliser 'default'
            if (!$restaurantId || $restaurantId === '') {
                $restaurantId = 'default';
                Log::info('Restaurant ID vide, utilisation de "default"');
            }

            Log::info('Recherche pour restaurant_id: ' . $restaurantId);

            // Chercher la planification pour ce restaurant
            $planning = null;
            foreach ($plannings as $plan) {
                Log::info('Comparaison: ' . $plan['restaurant_id'] . ' === ' . $restaurantId);
                if ($plan['restaurant_id'] === $restaurantId) {
                    $planning = $plan;
                    Log::info('✅ Planification trouvée!');
                    break;
                }
            }
            
            if (!$planning) {
                Log::warning('❌ Aucune planification trouvée pour ' . $restaurantId);
            }

            // S'il n'y a pas de planification, retourner une structure vide
            if (!$planning) {
                $emptyStructure = $this->getEmptyWeekStructure($restaurantId);
                Log::info('Aucune planification trouvée, retour structure vide:', $emptyStructure);
                return response()->json([
                    'success' => true,
                    'data' => $emptyStructure
                ]);
            }

            Log::info('Planification trouvée pour restaurant ' . $restaurantId);
            Log::info('Données retournées:', [
                'id' => $planning['id'] ?? 'N/A',
                'restaurant_id' => $planning['restaurant_id'] ?? 'N/A',
                'has_week_planning' => isset($planning['week_planning']),
                'monday_count' => count($planning['week_planning']['monday'] ?? []),
                'tuesday_count' => count($planning['week_planning']['tuesday'] ?? [])
            ]);

            return response()->json([
                'success' => true,
                'data' => $planning
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
            Log::info('=== DÉBUT SAUVEGARDE PLANNING HEBDO ===');
            Log::info('Données brutes reçues:', $request->all());
            
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

            Log::info('Données validées:', $validated);

            $restaurantId = $request->input('restaurant_id') ?? $request->header('X-User-Restaurant-Id');
            $createdByRaw = $request->header('X-User-Name') ?? 'Admin';
            $createdBy = mb_convert_encoding($createdByRaw, 'UTF-8', 'UTF-8');

            // Si pas de restaurant_id, utiliser 'default' temporairement
            if (!$restaurantId || $restaurantId === '') {
                $restaurantId = 'default';
                Log::info('Restaurant ID vide, utilisation de "default"');
            }

            Log::info('Restaurant ID: ' . $restaurantId);
            Log::info('Créé par: ' . $createdBy);

            // Nettoyer le planning en retirant les plats qui n'existent plus
            $menuItems = $this->loadMenuItems();
            $allItemIds = array_column($menuItems, 'id');

            Log::info('Validation des plats - IDs disponibles: ' . count($allItemIds));
            Log::info('IDs disponibles:', $allItemIds);
            Log::info('IDs à valider:', $validated['week_planning']);

            foreach ($validated['week_planning'] as $day => $items) {
                $validItems = [];
                foreach ($items as $itemId) {
                    if (in_array($itemId, $allItemIds)) {
                        $validItems[] = $itemId;
                    } else {
                        Log::warning("Plat ignoré (non trouvé): $itemId pour le jour $day");
                    }
                }
                $validated['week_planning'][$day] = $validItems;
            }

            Log::info('Planning nettoyé avec succès');

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

            // Si pas de restaurant_id, utiliser 'default'
            if (!$restaurantId || $restaurantId === '') {
                $restaurantId = 'default';
                Log::info('show() - Restaurant ID vide, utilisation de "default"');
            }

            Log::info('show() - Recherche planification pour: ' . $restaurantId);

            $plannings = $this->loadWeeklyPlanning();
            Log::info('show() - Planifications chargées: ' . count($plannings));
            
            $planning = null;

            foreach ($plannings as $plan) {
                if ($plan['restaurant_id'] === $restaurantId) {
                    $planning = $plan;
                    Log::info('show() - ✅ Planification trouvée avec ' . count($plan['week_planning']['monday'] ?? []) . ' plats lundi');
                    break;
                }
            }
            
            if (!$planning) {
                Log::warning('show() - ❌ Aucune planification pour ' . $restaurantId);
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
        Log::info('loadMenuItems: Vérification du fichier: ' . $this->menuItemsFile);
        
        if (!Storage::disk('local')->exists($this->menuItemsFile)) {
            Log::warning('loadMenuItems: Fichier introuvable: ' . $this->menuItemsFile);
            return [];
        }

        $content = Storage::disk('local')->get($this->menuItemsFile);
        Log::info('loadMenuItems: Contenu chargé, longueur: ' . strlen($content));
        
        $items = json_decode($content, true);
        if ($items === null) {
            Log::error('loadMenuItems: Erreur décodage JSON: ' . json_last_error_msg());
            return [];
        }
        
        Log::info('loadMenuItems: ' . count($items) . ' plats chargés');
        Log::info('loadMenuItems: Premier plat:', $items[0] ?? []);
        
        return $items ?? [];
    }

    /**
     * Sauvegarder la planification
     */
    private function savePlanning($plannings)
    {
        Log::info('savePlanning: Début - Nombre de planifications: ' . count($plannings));
        
        // Nettoyer les caractères UTF-8 invalides
        $cleanedPlannings = $this->cleanUtf8Recursively($plannings);
        Log::info('savePlanning: Nettoyage UTF-8 terminé');
        
        $json = json_encode($cleanedPlannings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        if ($json === false) {
            $errorMsg = json_last_error_msg();
            Log::error('Erreur encodage JSON: ' . $errorMsg);
            throw new \Exception('Impossible d\'encoder les données en JSON');
        }
        
        Log::info('savePlanning: Encodage JSON réussi - Taille: ' . strlen($json) . ' caractères');
        
        Storage::disk('local')->put($this->weeklyMenuFile, $json);
        Log::info('savePlanning: Fichier sauvegardé avec succès');
    }

    /**
     * Nettoyer récursivement les caractères UTF-8 invalides
     */
    private function cleanUtf8Recursively($data)
    {
        if (is_array($data)) {
            return array_map([$this, 'cleanUtf8Recursively'], $data);
        }
        
        if (is_string($data)) {
            return mb_convert_encoding($data, 'UTF-8', 'UTF-8');
        }
        
        return $data;
    }
}
