<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $roles = Role::with(['permissions', 'users'])
            ->withCount('users')
            ->get()
            ->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'description' => $role->description,
                    'is_system' => $role->is_system,
                    'permissions' => $role->permissions->pluck('name')->toArray(),
                    'user_count' => $role->users_count,
                    'created_at' => $role->created_at->format('Y-m-d'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles',
            'description' => 'nullable|string',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name'
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'is_system' => false
        ]);

        // Attacher les permissions
        if (isset($validated['permissions'])) {
            $permissionIds = Permission::whereIn('name', $validated['permissions'])->pluck('id');
            $role->permissions()->sync($permissionIds);
        }

        $role->load('permissions');

        return response()->json([
            'success' => true,
            'message' => 'Rôle créé avec succès',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'is_system' => $role->is_system,
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'user_count' => 0,
                'created_at' => $role->created_at->format('Y-m-d'),
            ]
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Role $role): JsonResponse
    {
        $role->load(['permissions', 'users']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'is_system' => $role->is_system,
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'user_count' => $role->users->count(),
                'created_at' => $role->created_at->format('Y-m-d'),
            ]
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('roles')->ignore($role->id)],
            'description' => 'nullable|string',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name'
        ]);

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? $role->description,
        ]);

        // Mettre à jour les permissions
        if (isset($validated['permissions'])) {
            $permissionIds = Permission::whereIn('name', $validated['permissions'])->pluck('id');
            $role->permissions()->sync($permissionIds);
        }

        $role->load('permissions');

        return response()->json([
            'success' => true,
            'message' => 'Rôle mis à jour avec succès',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'is_system' => $role->is_system,
                'permissions' => $role->permissions->pluck('name')->toArray(),
                'user_count' => $role->users()->count(),
                'created_at' => $role->created_at->format('Y-m-d'),
            ]
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role): JsonResponse
    {
        // Vérifier si le rôle est un rôle système
        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un rôle système'
            ], 403);
        }

        // Vérifier si des utilisateurs sont assignés à ce rôle
        if ($role->users()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer un rôle assigné à des utilisateurs'
            ], 409);
        }

        $role->permissions()->detach();
        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rôle supprimé avec succès'
        ]);
    }
}
