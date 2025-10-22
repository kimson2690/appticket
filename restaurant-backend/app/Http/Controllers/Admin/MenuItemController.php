<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    private $menuItemsFile = 'menu_items.json';

    /**
     * Récupérer tous les plats
     */
    public function index(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');
            $userRole = $request->header('X-User-Role');

            Log::info('Récupération des plats - Rôle: ' . $userRole . ', Restaurant ID: ' . $restaurantId);

            $menuItems = $this->loadMenuItems();

            // Filtrage par restaurant pour les gestionnaires de restaurant
            if ($userRole === 'Gestionnaire Restaurant' && $restaurantId) {
                $menuItems = array_filter($menuItems, function($item) use ($restaurantId) {
                    return $item['restaurant_id'] === $restaurantId;
                });
            }

            return response()->json([
                'success' => true,
                'data' => array_values($menuItems)
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des plats: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Créer un nouveau plat
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'restaurant_id' => 'nullable|string',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'category' => 'required|string',
                'image_url' => 'nullable|string',
                'is_available' => 'boolean',
                'preparation_time' => 'nullable|integer|min:0',
                'allergens' => 'nullable|array',
                'ingredients' => 'nullable|array',
            ]);

            // Récupérer restaurant_id depuis la requête ou le header
            $restaurantId = $request->input('restaurant_id') ?? $request->header('X-User-Restaurant-Id');
            $createdBy = $request->header('X-User-Name') ?? 'Admin';

            $menuItems = $this->loadMenuItems();

            $newItem = [
                'id' => 'menu_' . time() . '_' . rand(1000, 9999),
                'restaurant_id' => $restaurantId ?? '',
                'name' => $validated['name'],
                'description' => $validated['description'] ?? '',
                'price' => (float) $validated['price'],
                'category' => $validated['category'],
                'image_url' => $validated['image_url'] ?? null,
                'is_available' => $validated['is_available'] ?? true,
                'preparation_time' => $validated['preparation_time'] ?? null,
                'allergens' => $validated['allergens'] ?? [],
                'ingredients' => $validated['ingredients'] ?? [],
                'created_by' => $createdBy,
                'created_at' => now()->toDateTimeString(),
                'updated_at' => now()->toDateTimeString(),
            ];

            $menuItems[] = $newItem;
            $this->saveMenuItems($menuItems);

            Log::info('Plat créé avec succès: ' . $newItem['id']);

            return response()->json([
                'success' => true,
                'message' => 'Plat créé avec succès',
                'data' => $newItem
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Erreur de validation',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du plat: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer un plat spécifique
     */
    public function show(Request $request, $id)
    {
        try {
            $menuItems = $this->loadMenuItems();
            $item = collect($menuItems)->firstWhere('id', $id);

            if (!$item) {
                return response()->json(['error' => 'Plat non trouvé'], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $item
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du plat: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Mettre à jour un plat
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'sometimes|required|numeric|min:0',
                'category' => 'sometimes|required|string',
                'image_url' => 'nullable|string',
                'is_available' => 'boolean',
                'preparation_time' => 'nullable|integer|min:0',
                'allergens' => 'nullable|array',
                'ingredients' => 'nullable|array',
            ]);

            $menuItems = $this->loadMenuItems();
            $itemIndex = collect($menuItems)->search(function ($item) use ($id) {
                return $item['id'] === $id;
            });

            if ($itemIndex === false) {
                return response()->json(['error' => 'Plat non trouvé'], 404);
            }

            $menuItems[$itemIndex] = array_merge($menuItems[$itemIndex], $validated, [
                'updated_at' => now()->toDateTimeString()
            ]);

            $this->saveMenuItems($menuItems);

            Log::info('Plat mis à jour: ' . $id);

            return response()->json([
                'success' => true,
                'message' => 'Plat mis à jour avec succès',
                'data' => $menuItems[$itemIndex]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Erreur de validation',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour du plat: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Supprimer un plat
     */
    public function destroy(Request $request, $id)
    {
        try {
            $menuItems = $this->loadMenuItems();
            $itemIndex = collect($menuItems)->search(function ($item) use ($id) {
                return $item['id'] === $id;
            });

            if ($itemIndex === false) {
                return response()->json(['error' => 'Plat non trouvé'], 404);
            }

            array_splice($menuItems, $itemIndex, 1);
            $this->saveMenuItems($menuItems);

            Log::info('Plat supprimé: ' . $id);

            return response()->json([
                'success' => true,
                'message' => 'Plat supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression du plat: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Basculer la disponibilité d'un plat
     */
    public function toggleAvailability(Request $request, $id)
    {
        try {
            $menuItems = $this->loadMenuItems();
            $itemIndex = collect($menuItems)->search(function ($item) use ($id) {
                return $item['id'] === $id;
            });

            if ($itemIndex === false) {
                return response()->json(['error' => 'Plat non trouvé'], 404);
            }

            $menuItems[$itemIndex]['is_available'] = !$menuItems[$itemIndex]['is_available'];
            $menuItems[$itemIndex]['updated_at'] = now()->toDateTimeString();

            $this->saveMenuItems($menuItems);

            Log::info('Disponibilité du plat modifiée: ' . $id);

            return response()->json([
                'success' => true,
                'message' => 'Disponibilité mise à jour',
                'data' => $menuItems[$itemIndex]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la modification de disponibilité: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Charger les plats depuis le fichier JSON
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
     * Sauvegarder les plats dans le fichier JSON
     */
    private function saveMenuItems($menuItems)
    {
        $json = json_encode($menuItems, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        if ($json === false) {
            Log::error('Erreur d\'encodage JSON: ' . json_last_error_msg());
            throw new \Exception('Impossible d\'encoder les données en JSON');
        }
        
        Storage::disk('local')->put($this->menuItemsFile, $json);
    }
}
