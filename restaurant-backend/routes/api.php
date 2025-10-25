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
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Employee\EmployeeDashboardController;
use App\Http\Controllers\Employee\OrderController;
use App\Http\Controllers\Employee\EmployeeRestaurantController;
use App\Http\Controllers\Company\ReportingController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordResetController;

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
    Route::post('/employees/{id}/approve', [EmployeeController::class, 'approve']);
    Route::post('/employees/{id}/reject', [EmployeeController::class, 'reject']);
    
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
    
    // Gestion des notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    
    // Statistiques globales
    Route::get('/statistics', [StatisticsController::class, 'index']);
});

// Routes pour le reporting des entreprises
Route::prefix('company')->group(function () {
    // Statistiques de dépenses
    Route::get('/reports/restaurant-expenses', [ReportingController::class, 'getRestaurantExpenses']);
    Route::get('/reports/employee-expenses', [ReportingController::class, 'getEmployeeExpenses']);
});

// Routes pour les gestionnaires de restaurant
Route::prefix('restaurant')->group(function () {
    // Gestion des commandes
    Route::get('/orders', [\App\Http\Controllers\Restaurant\OrderManagementController::class, 'index']);
    Route::post('/orders/{id}/validate', [\App\Http\Controllers\Restaurant\OrderManagementController::class, 'validateOrder']);
    Route::post('/orders/{id}/reject', [\App\Http\Controllers\Restaurant\OrderManagementController::class, 'rejectOrder']);
    
    // Statistiques et rapports
    Route::get('/reports/company-orders', [\App\Http\Controllers\Restaurant\RestaurantReportingController::class, 'getCompanyOrders']);
    Route::get('/reports/employee-orders', [\App\Http\Controllers\Restaurant\RestaurantReportingController::class, 'getEmployeeOrders']);
});

// Routes pour les employés
Route::prefix('employee')->group(function () {
    // Profil et informations
    Route::get('/profile', [EmployeeDashboardController::class, 'getProfile']);
    Route::get('/ticket-balance', [EmployeeDashboardController::class, 'getTicketBalance']);
    Route::get('/ticket-history', [EmployeeDashboardController::class, 'getTicketHistory']);
    Route::get('/my-batches', [EmployeeDashboardController::class, 'getMyBatches']);
    
    // Restaurants partenaires
    Route::get('/restaurants', [EmployeeRestaurantController::class, 'getAvailableRestaurants']);
    
    // Commandes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
});

// Routes publiques pour l'authentification
Route::post('login', [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout']);
Route::get('me', [AuthController::class, 'me']);

// Routes de réinitialisation de mot de passe
Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword']);
Route::post('reset-password', [PasswordResetController::class, 'resetPassword']);

// Route de test pour le serveur mail
Route::get('test-email', function (Request $request) {
    try {
        $testEmail = $request->query('email', 'test@example.com');
        
        \Illuminate\Support\Facades\Mail::raw(
            'Ceci est un email de test depuis AppTicket. ' .
            'Si vous recevez cet email, votre configuration mail fonctionne correctement ! ✅' .
            "\n\n" .
            'Serveur: mail.kura-immo.com' .
            "\n" .
            'Date: ' . now()->format('d/m/Y H:i:s'),
            function ($message) use ($testEmail) {
                $message->to($testEmail)
                        ->subject('Test de configuration mail - AppTicket');
            }
        );
        
        $mailer = config('mail.default');
        
        return response()->json([
            'success' => true,
            'message' => 'Email de test envoyé avec succès !',
            'details' => [
                'to' => $testEmail,
                'from' => config('mail.from.address'),
                'mailer' => $mailer,
                'server' => config("mail.mailers.{$mailer}.host"),
                'port' => config("mail.mailers.{$mailer}.port"),
                'encryption' => config("mail.mailers.{$mailer}.encryption"),
                'sent_at' => now()->format('d/m/Y H:i:s')
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => 'Erreur lors de l\'envoi de l\'email',
            'message' => $e->getMessage(),
            'trace' => config('app.debug') ? $e->getTraceAsString() : null
        ], 500);
    }
});
