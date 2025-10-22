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
            Log::info('=== DÉBUT CRÉATION PLAT ===');
            Log::info('Données brutes reçues:', $request->all());
            
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

            Log::info('Données validées:', $validated);

            // Récupérer restaurant_id depuis la requête ou le header
            $restaurantId = $request->input('restaurant_id') ?? $request->header('X-User-Restaurant-Id');
            $createdByRaw = $request->header('X-User-Name') ?? 'Admin';
            
            // Nettoyer les caractères UTF-8 du nom de l'utilisateur
            $createdBy = mb_convert_encoding($createdByRaw, 'UTF-8', 'UTF-8');

            Log::info('Restaurant ID: ' . $restaurantId);
            Log::info('Créé par (brut): ' . $createdByRaw);
            Log::info('Créé par (nettoyé): ' . $createdBy);

            $menuItems = $this->loadMenuItems();
            Log::info('Nombre de plats existants: ' . count($menuItems));

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

            Log::info('Nouvel item créé:', $newItem);
            Log::info('Longueur image_url: ' . (isset($newItem['image_url']) ? strlen($newItem['image_url']) : 0));

            $menuItems[] = $newItem;
            Log::info('Nombre total de plats après ajout: ' . count($menuItems));
            
            Log::info('Appel de saveMenuItems...');
            $this->saveMenuItems($menuItems);
            Log::info('saveMenuItems terminé avec succès');

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
        Log::info('saveMenuItems: Début - Nombre d\'items: ' . count($menuItems));
        
        // Nettoyer les caractères UTF-8 invalides dans toutes les chaînes
        Log::info('saveMenuItems: Nettoyage UTF-8...');
        $cleanedItems = $this->cleanUtf8Recursively($menuItems);
        Log::info('saveMenuItems: Nettoyage terminé');
        
        // Vérifier chaque item pour des problèmes potentiels
        foreach ($cleanedItems as $index => $item) {
            if (isset($item['image_url']) && !empty($item['image_url'])) {
                $imageLength = strlen($item['image_url']);
                Log::info("Item $index - image_url longueur: $imageLength caractères");
                
                // Vérifier si c'est une image base64
                if (strpos($item['image_url'], 'data:image') === 0) {
                    Log::info("Item $index - Image base64 détectée");
                }
            }
        }
        
        Log::info('saveMenuItems: Encodage JSON...');
        $json = json_encode($cleanedItems, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        if ($json === false) {
            $errorMsg = json_last_error_msg();
            $errorCode = json_last_error();
            Log::error('Erreur d\'encodage JSON - Code: ' . $errorCode . ' - Message: ' . $errorMsg);
            
            // Log détaillé du dernier item ajouté (probablement celui qui pose problème)
            $lastItem = end($cleanedItems);
            Log::error('Dernier item ajouté:', [
                'id' => $lastItem['id'] ?? 'N/A',
                'name' => $lastItem['name'] ?? 'N/A',
                'has_image' => isset($lastItem['image_url']) && !empty($lastItem['image_url'])
            ]);
            
            throw new \Exception('Impossible d\'encoder les données en JSON');
        }
        
        Log::info('saveMenuItems: Encodage réussi - Taille JSON: ' . strlen($json) . ' caractères');
        Log::info('saveMenuItems: Écriture dans le fichier...');
        
        Storage::disk('local')->put($this->menuItemsFile, $json);
        
        Log::info('saveMenuItems: Fichier sauvegardé avec succès');
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
            // Supprimer les caractères UTF-8 invalides
            return mb_convert_encoding($data, 'UTF-8', 'UTF-8');
        }
        
        return $data;
    }
}
