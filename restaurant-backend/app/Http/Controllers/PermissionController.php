<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $permissions = Permission::all()->groupBy('category')->map(function ($permissions, $category) {
            return [
                'category' => $category,
                'permissions' => $permissions->map(function ($permission) {
                    return [
                        'id' => $permission->name,
                        'name' => $permission->name,
                        'description' => $permission->description,
                        'category' => $permission->category,
                    ];
                })->values()
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }

    /**
     * Get all permissions as a flat list
     */
    public function all(): JsonResponse
    {
        $permissions = Permission::all()->map(function ($permission) {
            return [
                'id' => $permission->name,
                'name' => $permission->name,
                'description' => $permission->description,
                'category' => $permission->category,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }
}
