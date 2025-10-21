<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\RestaurantController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Routes pour la gestion des rôles et permissions
Route::prefix('admin')->group(function () {
    // Rôles
    Route::apiResource('roles', RoleController::class);
    
    // Permissions
    Route::get('permissions', [PermissionController::class, 'index']);
    Route::get('permissions/all', [PermissionController::class, 'all']);
    
    // Gestion des entreprises
    Route::get('/companies', [CompanyController::class, 'index']);
    Route::post('/companies', [CompanyController::class, 'store']);
    Route::get('/companies/{id}', [CompanyController::class, 'show']);
    Route::put('/companies/{id}', [CompanyController::class, 'update']);
    Route::delete('/companies/{id}', [CompanyController::class, 'destroy']);
    
    // Gestion des restaurants
    Route::get('/restaurants', [RestaurantController::class, 'index']);
    Route::post('/restaurants', [RestaurantController::class, 'store']);
    Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);
    Route::put('/restaurants/{id}', [RestaurantController::class, 'update']);
    Route::delete('/restaurants/{id}', [RestaurantController::class, 'destroy']);
});

// Routes publiques pour l'authentification
Route::post('login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required'
    ]);

    if ($credentials['email'] === 'admin@appticket.com' && $credentials['password'] === 'admin123') {
        return response()->json([
            'success' => true,
            'user' => [
                'id' => 1,
                'email' => 'admin@appticket.com',
                'role' => 'admin'
            ],
            'token' => 'mock-token-for-admin'
        ]);
    }

    return response()->json([
        'success' => false,
        'message' => 'Identifiants incorrects'
    ], 401);
});
