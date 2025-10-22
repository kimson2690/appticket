<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(): JsonResponse
    {
        try {
            $users = User::with(['role', 'company', 'restaurant'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => (string) $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'role_id' => (string) $user->role_id,
                        'role_name' => $user->role->name ?? 'Non défini',
                        'company_id' => $user->company_id ? (string) $user->company_id : null,
                        'company_name' => $user->company->name ?? null,
                        'restaurant_id' => $user->restaurant_id ? (string) $user->restaurant_id : null,
                        'restaurant_name' => $user->restaurant->name ?? null,
                        'status' => $user->status ?? 'active',
                        'email_verified_at' => $user->email_verified_at?->format('Y-m-d H:i:s'),
                        'created_at' => $user->created_at->format('Y-m-d'),
                        'updated_at' => $user->updated_at->format('Y-m-d'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des utilisateurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users',
                'phone' => 'nullable|string|max:20',
                'password' => 'required|string|min:6',
                'role_id' => 'required|exists:roles,id',
                'company_id' => 'nullable|exists:companies,id',
                'restaurant_id' => 'nullable|exists:restaurants,id',
                'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            ]);

            // Diviser le nom complet en prénom et nom
            $nameParts = explode(' ', trim($validated['name']), 2);
            $validated['first_name'] = $nameParts[0];
            $validated['last_name'] = $nameParts[1] ?? '';

            // Hasher le mot de passe
            $validated['password'] = Hash::make($validated['password']);

            $user = User::create($validated);
            $user->load(['role', 'company', 'restaurant']);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role_id' => (string) $user->role_id,
                    'role_name' => $user->role->name,
                    'company_id' => $user->company_id ? (string) $user->company_id : null,
                    'company_name' => $user->company->name ?? null,
                    'restaurant_id' => $user->restaurant_id ? (string) $user->restaurant_id : null,
                    'restaurant_name' => $user->restaurant->name ?? null,
                    'status' => $user->status,
                    'created_at' => $user->created_at->format('Y-m-d'),
                    'updated_at' => $user->updated_at->format('Y-m-d'),
                ],
                'message' => 'Utilisateur créé avec succès'
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
                'message' => 'Erreur lors de la création de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified user.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $user = User::with(['role', 'company', 'restaurant'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role_id' => (string) $user->role_id,
                    'role_name' => $user->role->name,
                    'company_id' => $user->company_id ? (string) $user->company_id : null,
                    'company_name' => $user->company->name ?? null,
                    'restaurant_id' => $user->restaurant_id ? (string) $user->restaurant_id : null,
                    'restaurant_name' => $user->restaurant->name ?? null,
                    'status' => $user->status,
                    'email_verified_at' => $user->email_verified_at?->format('Y-m-d H:i:s'),
                    'created_at' => $user->created_at->format('Y-m-d'),
                    'updated_at' => $user->updated_at->format('Y-m-d'),
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $id,
                'phone' => 'nullable|string|max:20',
                'password' => 'nullable|string|min:6',
                'role_id' => 'required|exists:roles,id',
                'company_id' => 'nullable|exists:companies,id',
                'restaurant_id' => 'nullable|exists:restaurants,id',
                'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            ]);

            // Diviser le nom complet en prénom et nom
            $nameParts = explode(' ', trim($validated['name']), 2);
            $validated['first_name'] = $nameParts[0];
            $validated['last_name'] = $nameParts[1] ?? '';

            // Hasher le mot de passe seulement s'il est fourni
            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $user->update($validated);
            $user->load(['role', 'company', 'restaurant']);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role_id' => (string) $user->role_id,
                    'role_name' => $user->role->name,
                    'company_id' => $user->company_id ? (string) $user->company_id : null,
                    'company_name' => $user->company->name ?? null,
                    'restaurant_id' => $user->restaurant_id ? (string) $user->restaurant_id : null,
                    'restaurant_name' => $user->restaurant->name ?? null,
                    'status' => $user->status,
                    'created_at' => $user->created_at->format('Y-m-d'),
                    'updated_at' => $user->updated_at->format('Y-m-d'),
                ],
                'message' => 'Utilisateur mis à jour avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
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
                'message' => 'Erreur lors de la mise à jour de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
