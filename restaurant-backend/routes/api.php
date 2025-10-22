<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\RestaurantController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\EmployeeController;
use App\Http\Controllers\Admin\StatisticsController;
use App\Http\Controllers\Admin\TicketConfigurationController;
use App\Http\Controllers\Admin\TicketBatchController;
use App\Http\Controllers\AuthController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Routes pour la gestion des rôles et permissions
Route::prefix('admin')->group(function () {
    // Rôles
    Route::apiResource('roles', AdminRoleController::class);
    
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
    
    // Gestion des utilisateurs
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    
    // Gestion des employés
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);
    
    // Configuration des tickets
    Route::get('/ticket-configurations', [TicketConfigurationController::class, 'index']);
    Route::post('/ticket-configurations', [TicketConfigurationController::class, 'store']);
    Route::get('/ticket-configurations/{id}', [TicketConfigurationController::class, 'show']);
    Route::put('/ticket-configurations/{id}', [TicketConfigurationController::class, 'update']);
    Route::delete('/ticket-configurations/{id}', [TicketConfigurationController::class, 'destroy']);
    Route::get('/ticket-configurations/active/config', [TicketConfigurationController::class, 'getActiveConfig']);
    
    // Souches de tickets
    Route::get('/ticket-batches', [TicketBatchController::class, 'index']);
    Route::post('/ticket-batches', [TicketBatchController::class, 'store']);
    Route::get('/ticket-batches/{id}', [TicketBatchController::class, 'show']);
    Route::delete('/ticket-batches/{id}', [TicketBatchController::class, 'destroy']);
    Route::post('/ticket-batches/{id}/use', [TicketBatchController::class, 'useTicket']);
    
    // Statistiques globales
    Route::get('/statistics', [StatisticsController::class, 'index']);
});

// Routes publiques pour l'authentification
Route::post('login', [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout']);
Route::get('me', [AuthController::class, 'me']);
