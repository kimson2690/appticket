<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DailyMenuController extends Controller
{
    private $menusFile = 'daily_menus.json';
    private $menuItemsFile = 'menu_items.json';

    /**
     * Récupérer tous les menus
     */
    public function index(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');
            $userRole = $request->header('X-User-Role');

            Log::info('Récupération des menus - Rôle: ' . $userRole . ', Restaurant ID: ' . $restaurantId);

            $menus = $this->loadMenus();

            // Filtrage par restaurant pour les gestionnaires de restaurant
            if ($userRole === 'Gestionnaire Restaurant' && $restaurantId) {
                $menus = array_filter($menus, function($menu) use ($restaurantId) {
                    return $menu['restaurant_id'] === $restaurantId;
                });
            }

            return response()->json([
                'success' => true,
                'data' => array_values($menus)
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des menus: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Créer un nouveau menu
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'restaurant_id' => 'nullable|string',
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:daily,weekly,special',
                'day_of_week' => 'nullable|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                'valid_from' => 'required|date',
                'valid_until' => 'required|date|after_or_equal:valid_from',
                'price' => 'required|numeric|min:0',
                'items' => 'required|array',
                'items.*.item_id' => 'required|string',
                'items.*.category' => 'required|string',
                'is_available' => 'boolean',
            ]);

            // Récupérer restaurant_id depuis la requête ou le header
            $restaurantId = $request->input('restaurant_id') ?? $request->header('X-User-Restaurant-Id');
            $createdBy = $request->header('X-User-Name') ?? 'Admin';

            $menus = $this->loadMenus();

            // Charger les plats pour validation
            $menuItems = $this->loadMenuItems();
            
            // Valider que tous les plats existent
            foreach ($validated['items'] as $item) {
                $found = false;
                foreach ($menuItems as $menuItem) {
                    if ($menuItem['id'] === $item['item_id']) {
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    return response()->json([
                        'error' => 'Plat non trouvé: ' . $item['item_id']
                    ], 400);
                }
            }

            $newMenu = [
                'id' => 'daily_menu_' . time() . '_' . rand(1000, 9999),
                'restaurant_id' => $restaurantId ?? '',
                'name' => $validated['name'],
                'description' => $validated['description'] ?? '',
                'type' => $validated['type'],
                'day_of_week' => $validated['day_of_week'] ?? null,
                'valid_from' => $validated['valid_from'],
                'valid_until' => $validated['valid_until'],
                'price' => (float) $validated['price'],
                'items' => $validated['items'],
                'is_available' => $validated['is_available'] ?? true,
                'created_by' => $createdBy,
                'created_at' => now()->toDateTimeString(),
                'updated_at' => now()->toDateTimeString(),
            ];

            $menus[] = $newMenu;
            $this->saveMenus($menus);

            Log::info('Menu créé avec succès: ' . $newMenu['id']);

            return response()->json([
                'success' => true,
                'message' => 'Menu créé avec succès',
                'data' => $newMenu
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Erreur de validation',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création du menu: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer un menu spécifique avec les détails des plats
     */
    public function show(Request $request, $id)
    {
        try {
            $menus = $this->loadMenus();
            $menu = collect($menus)->firstWhere('id', $id);

            if (!$menu) {
                return response()->json(['error' => 'Menu non trouvé'], 404);
            }

            // Enrichir avec les détails des plats
            $menuItems = $this->loadMenuItems();
            $enrichedItems = [];
            
            foreach ($menu['items'] as $item) {
                $menuItem = collect($menuItems)->firstWhere('id', $item['item_id']);
                if ($menuItem) {
                    $enrichedItems[] = [
                        'category' => $item['category'],
                        'item' => $menuItem
                    ];
                }
            }
            
            $menu['enriched_items'] = $enrichedItems;

            return response()->json([
                'success' => true,
                'data' => $menu
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du menu: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Mettre à jour un menu
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'sometimes|required|in:daily,weekly,special',
                'day_of_week' => 'nullable|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
                'valid_from' => 'sometimes|required|date',
                'valid_until' => 'sometimes|required|date|after_or_equal:valid_from',
                'price' => 'sometimes|required|numeric|min:0',
                'items' => 'sometimes|required|array',
                'items.*.item_id' => 'required|string',
                'items.*.category' => 'required|string',
                'is_available' => 'boolean',
            ]);

            $menus = $this->loadMenus();
            $menuIndex = collect($menus)->search(function ($menu) use ($id) {
                return $menu['id'] === $id;
            });

            if ($menuIndex === false) {
                return response()->json(['error' => 'Menu non trouvé'], 404);
            }

            // Valider les plats si items est fourni
            if (isset($validated['items'])) {
                $menuItems = $this->loadMenuItems();
                foreach ($validated['items'] as $item) {
                    $found = false;
                    foreach ($menuItems as $menuItem) {
                        if ($menuItem['id'] === $item['item_id']) {
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) {
                        return response()->json([
                            'error' => 'Plat non trouvé: ' . $item['item_id']
                        ], 400);
                    }
                }
            }

            $menus[$menuIndex] = array_merge($menus[$menuIndex], $validated, [
                'updated_at' => now()->toDateTimeString()
            ]);

            $this->saveMenus($menus);

            Log::info('Menu mis à jour: ' . $id);

            return response()->json([
                'success' => true,
                'message' => 'Menu mis à jour avec succès',
                'data' => $menus[$menuIndex]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'error' => 'Erreur de validation',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour du menu: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Supprimer un menu
     */
    public function destroy(Request $request, $id)
    {
        try {
            $menus = $this->loadMenus();
            $menuIndex = collect($menus)->search(function ($menu) use ($id) {
                return $menu['id'] === $id;
            });

            if ($menuIndex === false) {
                return response()->json(['error' => 'Menu non trouvé'], 404);
            }

            array_splice($menus, $menuIndex, 1);
            $this->saveMenus($menus);

            Log::info('Menu supprimé: ' . $id);

            return response()->json([
                'success' => true,
                'message' => 'Menu supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression du menu: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Basculer la disponibilité d'un menu
     */
    public function toggleAvailability(Request $request, $id)
    {
        try {
            $menus = $this->loadMenus();
            $menuIndex = collect($menus)->search(function ($menu) use ($id) {
                return $menu['id'] === $id;
            });

            if ($menuIndex === false) {
                return response()->json(['error' => 'Menu non trouvé'], 404);
            }

            $menus[$menuIndex]['is_available'] = !$menus[$menuIndex]['is_available'];
            $menus[$menuIndex]['updated_at'] = now()->toDateTimeString();

            $this->saveMenus($menus);

            Log::info('Disponibilité du menu modifiée: ' . $id);

            return response()->json([
                'success' => true,
                'message' => 'Disponibilité mise à jour',
                'data' => $menus[$menuIndex]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la modification de disponibilité: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Charger les menus depuis le fichier JSON
     */
    private function loadMenus()
    {
        if (!Storage::disk('local')->exists($this->menusFile)) {
            return [];
        }

        $content = Storage::disk('local')->get($this->menusFile);
        return json_decode($content, true) ?? [];
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
     * Sauvegarder les menus dans le fichier JSON
     */
    private function saveMenus($menus)
    {
        $json = json_encode($menus, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        if ($json === false) {
            Log::error('Erreur d\'encodage JSON: ' . json_last_error_msg());
            throw new \Exception('Impossible d\'encoder les données en JSON');
        }
        
        Storage::disk('local')->put($this->menusFile, $json);
    }
}
