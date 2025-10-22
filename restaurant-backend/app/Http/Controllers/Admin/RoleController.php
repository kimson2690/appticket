<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class RoleController extends Controller
{
    /**
     * Display a listing of the roles.
     */
    public function index(): JsonResponse
    {
        try {
            Log::info('Admin/RoleController@index - Récupération des rôles');
            
            $roles = Role::orderBy('name')->get();
            
            $rolesData = $roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'user_count' => $role->users()->count(), // Nombre d'utilisateurs avec ce rôle
                    'created_at' => $role->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $role->updated_at->format('Y-m-d H:i:s'),
                ];
            });

            Log::info('Admin/RoleController@index - Rôles récupérés: ' . $roles->count());

            return response()->json([
                'success' => true,
                'data' => $rolesData
            ]);
            
        } catch (\Exception $e) {
            Log::error('Admin/RoleController@index - Erreur: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des rôles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('Admin/RoleController@store - Création d\'un rôle');
            Log::info('Données reçues:', $request->all());
            
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles',
                'description' => 'nullable|string|max:500',
            ]);

            $role = Role::create($validated);

            Log::info('Admin/RoleController@store - Rôle créé: ' . $role->id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'created_at' => $role->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $role->updated_at->format('Y-m-d H:i:s'),
                ],
                'message' => 'Rôle créé avec succès'
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Admin/RoleController@store - Erreur de validation:', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Admin/RoleController@store - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du rôle',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified role.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $role = Role::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'created_at' => $role->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $role->updated_at->format('Y-m-d H:i:s'),
                ]
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Admin/RoleController@show - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du rôle',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $role = Role::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name,' . $id,
                'description' => 'nullable|string|max:500',
            ]);

            $role->update($validated);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'created_at' => $role->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $role->updated_at->format('Y-m-d H:i:s'),
                ],
                'message' => 'Rôle mis à jour avec succès'
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Admin/RoleController@update - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du rôle',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified role.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $role = Role::findOrFail($id);

            // Vérifier si le rôle est utilisé par des utilisateurs
            if ($role->users()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce rôle car il est utilisé par des utilisateurs'
                ], 422);
            }

            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rôle supprimé avec succès'
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Admin/RoleController@destroy - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du rôle',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
