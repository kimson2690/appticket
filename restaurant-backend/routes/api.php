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
use App\Http\Controllers\Admin\UserTicketController;
use App\Http\Controllers\Admin\MigrateBatchNumbersController;
use App\Http\Controllers\Admin\CompanyRestaurantController;
use App\Http\Controllers\Admin\MenuItemController;
use App\Http\Controllers\Admin\DailyMenuController;
use App\Http\Controllers\Admin\WeeklyMenuController;
use App\Http\Controllers\Employee\EmployeeDashboardController;
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
    
    // Gestion des plats (menu)
    Route::get('/menu-items', [MenuItemController::class, 'index']);
    Route::post('/menu-items', [MenuItemController::class, 'store']);
    Route::get('/menu-items/{id}', [MenuItemController::class, 'show']);
    Route::put('/menu-items/{id}', [MenuItemController::class, 'update']);
    Route::delete('/menu-items/{id}', [MenuItemController::class, 'destroy']);
    Route::post('/menu-items/{id}/toggle-availability', [MenuItemController::class, 'toggleAvailability']);
    
    // Gestion des menus composés (menu du jour/semaine)
    Route::get('/daily-menus', [DailyMenuController::class, 'index']);
    Route::post('/daily-menus', [DailyMenuController::class, 'store']);
    Route::get('/daily-menus/{id}', [DailyMenuController::class, 'show']);
    Route::put('/daily-menus/{id}', [DailyMenuController::class, 'update']);
    Route::delete('/daily-menus/{id}', [DailyMenuController::class, 'destroy']);
    Route::post('/daily-menus/{id}/toggle-availability', [DailyMenuController::class, 'toggleAvailability']);
    
    // Gestion de la planification hebdomadaire des plats
    Route::get('/weekly-menu', [WeeklyMenuController::class, 'index']);
    Route::post('/weekly-menu', [WeeklyMenuController::class, 'store']);
    Route::get('/weekly-menu/current', [WeeklyMenuController::class, 'show']);
    
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
    
    // Gestion des tickets utilisateurs
    Route::post('/employees/{id}/assign-tickets', [UserTicketController::class, 'assignTickets']);
    Route::post('/employees/{id}/recharge', [UserTicketController::class, 'rechargeBalance']);
    Route::post('/employees/bulk-assign-tickets', [UserTicketController::class, 'bulkAssignTickets']);
    Route::get('/ticket-assignments', [UserTicketController::class, 'getAssignments']);
    
    // Migration des numéros de souches
    Route::post('/migrate-batch-numbers', [MigrateBatchNumbersController::class, 'migrate']);
    
    // Gestion des partenariats entreprise-restaurant
    Route::get('/company-restaurants/partners', [CompanyRestaurantController::class, 'getPartnerRestaurants']);
    Route::get('/company-restaurants/available', [CompanyRestaurantController::class, 'getAvailableRestaurants']);
    Route::post('/company-restaurants/partners', [CompanyRestaurantController::class, 'updatePartnerRestaurants']);
    
    // Statistiques globales
    Route::get('/statistics', [StatisticsController::class, 'index']);
});

// Routes pour les employés
Route::prefix('employee')->group(function () {
    // Profil et informations
    Route::get('/profile', [EmployeeDashboardController::class, 'getProfile']);
    Route::get('/ticket-balance', [EmployeeDashboardController::class, 'getTicketBalance']);
    Route::get('/ticket-history', [EmployeeDashboardController::class, 'getTicketHistory']);
    Route::get('/my-batches', [EmployeeDashboardController::class, 'getMyBatches']);
});

// Routes publiques pour l'authentification
Route::post('login', [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout']);
Route::get('me', [AuthController::class, 'me']);
