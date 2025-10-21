<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class RestaurantController extends Controller
{
    /**
     * Display a listing of restaurants.
     */
    public function index(): JsonResponse
    {
        try {
            $restaurants = Restaurant::orderBy('created_at', 'desc')
                ->get()
                ->map(function ($restaurant) {
                    return [
                        'id' => (string) $restaurant->id,
                        'name' => $restaurant->name,
                        'email' => $restaurant->email,
                        'phone' => $restaurant->phone,
                        'address' => $restaurant->address,
                        'city' => $restaurant->city,
                        'postal_code' => $restaurant->postal_code,
                        'country' => $restaurant->country,
                        'cuisine_type' => $restaurant->cuisine_type,
                        'description' => $restaurant->description,
                        'logo' => $restaurant->logo,
                        'website' => $restaurant->website,
                        'opening_hours' => $restaurant->opening_hours,
                        'delivery_fee' => $restaurant->delivery_fee ?? 0,
                        'minimum_order' => $restaurant->minimum_order ?? 0,
                        'average_rating' => $restaurant->average_rating ?? 0,
                        'total_reviews' => $restaurant->total_reviews ?? 0,
                        'status' => $restaurant->status,
                        'is_partner' => $restaurant->is_partner ?? true,
                        'commission_rate' => $restaurant->commission_rate ?? 15,
                        'created_at' => $restaurant->created_at->format('Y-m-d'),
                        'updated_at' => $restaurant->updated_at->format('Y-m-d'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $restaurants
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des restaurants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created restaurant.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:restaurants',
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:500',
                'city' => 'required|string|max:100',
                'postal_code' => 'nullable|string|max:10',
                'country' => 'required|string|max:100',
                'cuisine_type' => 'required|string|max:100',
                'description' => 'nullable|string|max:1000',
                'website' => 'nullable|url|max:255',
                'opening_hours' => 'nullable|string|max:255',
                'delivery_fee' => 'nullable|numeric|min:0',
                'minimum_order' => 'nullable|numeric|min:0',
                'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
                'is_partner' => 'boolean',
                'commission_rate' => 'nullable|numeric|min:0|max:100',
            ]);

            // Ajouter des valeurs par défaut
            $validated['delivery_fee'] = $validated['delivery_fee'] ?? 0;
            $validated['minimum_order'] = $validated['minimum_order'] ?? 0;
            $validated['is_partner'] = $validated['is_partner'] ?? true;
            $validated['commission_rate'] = $validated['commission_rate'] ?? 15;

            $restaurant = Restaurant::create($validated);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $restaurant->id,
                    'name' => $restaurant->name,
                    'email' => $restaurant->email,
                    'phone' => $restaurant->phone,
                    'address' => $restaurant->address,
                    'city' => $restaurant->city,
                    'postal_code' => $restaurant->postal_code,
                    'country' => $restaurant->country,
                    'cuisine_type' => $restaurant->cuisine_type,
                    'description' => $restaurant->description,
                    'website' => $restaurant->website,
                    'opening_hours' => $restaurant->opening_hours,
                    'delivery_fee' => $restaurant->delivery_fee,
                    'minimum_order' => $restaurant->minimum_order,
                    'average_rating' => 0,
                    'total_reviews' => 0,
                    'status' => $restaurant->status,
                    'is_partner' => $restaurant->is_partner,
                    'commission_rate' => $restaurant->commission_rate,
                    'created_at' => $restaurant->created_at->format('Y-m-d'),
                    'updated_at' => $restaurant->updated_at->format('Y-m-d'),
                ],
                'message' => 'Restaurant créé avec succès'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du restaurant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified restaurant.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $restaurant = Restaurant::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $restaurant->id,
                    'name' => $restaurant->name,
                    'email' => $restaurant->email,
                    'phone' => $restaurant->phone,
                    'address' => $restaurant->address,
                    'city' => $restaurant->city,
                    'postal_code' => $restaurant->postal_code,
                    'country' => $restaurant->country,
                    'cuisine_type' => $restaurant->cuisine_type,
                    'description' => $restaurant->description,
                    'website' => $restaurant->website,
                    'opening_hours' => $restaurant->opening_hours,
                    'delivery_fee' => $restaurant->delivery_fee,
                    'minimum_order' => $restaurant->minimum_order,
                    'average_rating' => $restaurant->average_rating ?? 0,
                    'total_reviews' => $restaurant->total_reviews ?? 0,
                    'status' => $restaurant->status,
                    'is_partner' => $restaurant->is_partner,
                    'commission_rate' => $restaurant->commission_rate,
                    'created_at' => $restaurant->created_at->format('Y-m-d'),
                    'updated_at' => $restaurant->updated_at->format('Y-m-d'),
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du restaurant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified restaurant.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $restaurant = Restaurant::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:restaurants,email,' . $id,
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:500',
                'city' => 'required|string|max:100',
                'postal_code' => 'nullable|string|max:10',
                'country' => 'required|string|max:100',
                'cuisine_type' => 'required|string|max:100',
                'description' => 'nullable|string|max:1000',
                'website' => 'nullable|url|max:255',
                'opening_hours' => 'nullable|string|max:255',
                'delivery_fee' => 'nullable|numeric|min:0',
                'minimum_order' => 'nullable|numeric|min:0',
                'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
                'is_partner' => 'boolean',
                'commission_rate' => 'nullable|numeric|min:0|max:100',
            ]);

            $restaurant->update($validated);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $restaurant->id,
                    'name' => $restaurant->name,
                    'email' => $restaurant->email,
                    'phone' => $restaurant->phone,
                    'address' => $restaurant->address,
                    'city' => $restaurant->city,
                    'postal_code' => $restaurant->postal_code,
                    'country' => $restaurant->country,
                    'cuisine_type' => $restaurant->cuisine_type,
                    'description' => $restaurant->description,
                    'website' => $restaurant->website,
                    'opening_hours' => $restaurant->opening_hours,
                    'delivery_fee' => $restaurant->delivery_fee,
                    'minimum_order' => $restaurant->minimum_order,
                    'average_rating' => $restaurant->average_rating ?? 0,
                    'total_reviews' => $restaurant->total_reviews ?? 0,
                    'status' => $restaurant->status,
                    'is_partner' => $restaurant->is_partner,
                    'commission_rate' => $restaurant->commission_rate,
                    'created_at' => $restaurant->created_at->format('Y-m-d'),
                    'updated_at' => $restaurant->updated_at->format('Y-m-d'),
                ],
                'message' => 'Restaurant mis à jour avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant non trouvé'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du restaurant',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified restaurant.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $restaurant = Restaurant::findOrFail($id);
            
            $restaurant->delete();

            return response()->json([
                'success' => true,
                'message' => 'Restaurant supprimé avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Restaurant non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du restaurant',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
