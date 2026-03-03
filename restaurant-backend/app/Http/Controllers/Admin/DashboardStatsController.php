<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\Employee;
use App\Models\DirectPayment;
use App\Models\Order;
use App\Models\UserTicket;
use App\Models\TicketBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardStatsController extends Controller
{
    /**
     * Statistiques pour l'administrateur système
     */
    public function getAdminStats(Request $request)
    {
        try {
            // Statistiques générales depuis la BDD
            $totalUsers = Employee::count() + User::count();
            $totalCompanies = Company::count();
            $totalRestaurants = Restaurant::count();
            $totalOrders = Order::where('status', 'confirmed')->count()
                + DirectPayment::where('status', 'completed')->count();

            Log::info('📊 [DashboardStats] Données chargées depuis MySQL', [
                'employees' => Employee::count(),
                'users' => User::count(),
                'companies' => $totalCompanies,
                'restaurants' => $totalRestaurants,
                'orders' => $totalOrders,
            ]);

            // Répartition par rôle - Combiner Users (admins/gestionnaires) + Employees
            $usersByRole = [];

            // Compter les utilisateurs de la BDD (gestionnaires, admins)
            $usersFromDB = User::with('role')->get();
            foreach ($usersFromDB as $user) {
                $role = $user->role->name ?? 'Utilisateur';
                $usersByRole[$role] = ($usersByRole[$role] ?? 0) + 1;
            }

            // Ajouter les employés
            $employeeCount = Employee::count();
            $usersByRole['Employé'] = ($usersByRole['Employé'] ?? 0) + $employeeCount;

            // Tickets émis - agrégation SQL
            $ticketStats = UserTicket::selectRaw('
                SUM(tickets_count) as total_tickets,
                SUM(tickets_count * ticket_value) as total_value
            ')->first();

            $totalTicketsIssued = $ticketStats->total_tickets ?? 0;
            $totalTicketsValue = $ticketStats->total_value ?? 0;

            // Commandes par mois (6 derniers mois)
            $ordersByMonth = $this->getOrdersByMonth();

            // Restaurants les plus actifs
            $restaurantStats = $this->getTopRestaurantsByRevenue();

            // Commandes par entreprise
            $ordersByCompany = $this->getOrdersByCompany();

            // Tickets affectés par mois et par entreprise
            $ticketsByMonthAndCompany = $this->getTicketsByMonthAndCompany();

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_users' => $totalUsers,
                        'total_companies' => $totalCompanies,
                        'total_restaurants' => $totalRestaurants,
                        'total_orders' => $totalOrders,
                        'total_tickets_issued' => $totalTicketsIssued,
                        'total_tickets_value' => $totalTicketsValue,
                    ],
                    'users_by_role' => $usersByRole,
                    'orders_by_month' => $ordersByMonth,
                    'top_restaurants' => array_slice($restaurantStats, 0, 5),
                    'orders_by_company' => $ordersByCompany,
                    'tickets_by_month_company' => $ticketsByMonthAndCompany,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [DashboardStats] Erreur getAdminStats', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Statistiques pour le gestionnaire d'entreprise
     */
    public function getCompanyStats(Request $request)
    {
        try {
            $companyId = $request->header('X-User-Company-Id');

            if (!$companyId) {
                return response()->json(['error' => 'Company ID manquant'], 401);
            }

            // Récupérer les IDs des employés de l'entreprise
            $companyEmployeeIds = Employee::where('company_id', $companyId)
                ->pluck('id')
                ->toArray();

            // Statistiques générales (uniquement commandes confirmées)
            $totalEmployees = count($companyEmployeeIds);
            $totalOrders = Order::whereIn('employee_id', $companyEmployeeIds)
                ->where('status', 'confirmed')->count()
                + DirectPayment::whereIn('employee_id', $companyEmployeeIds)
                    ->where('status', 'completed')
                    ->count();
            $totalSpent = (float) Order::whereIn('employee_id', $companyEmployeeIds)
                ->where('status', 'confirmed')
                ->sum('total_amount')
                + (float) DirectPayment::whereIn('employee_id', $companyEmployeeIds)
                    ->where('status', 'completed')
                    ->sum('amount');

            // Dépenses par restaurant
            $expensesByRestaurant = $this->getExpensesByRestaurant($companyEmployeeIds);

            // Dépenses par employé
            $expensesByEmployee = $this->getExpensesByEmployee($companyEmployeeIds);

            // Évolution mensuelle
            $monthlyExpenses = $this->getMonthlyExpenses($companyEmployeeIds);

            // Taux d'utilisation des tickets
            $totalAssigned = UserTicket::whereIn('employee_id', $companyEmployeeIds)
                ->sum('tickets_count');

            // Calculer le solde total restant de tous les employés
            $totalBalanceAmount = Employee::whereIn('id', $companyEmployeeIds)
                ->sum('ticket_balance');

            // Obtenir la valeur d'un ticket (depuis la première affectation ou config)
            $ticketValue = UserTicket::whereIn('employee_id', $companyEmployeeIds)
                ->value('ticket_value') ?? 500;

            // Convertir le solde en nombre de tickets
            $totalBalanceTickets = $ticketValue > 0 ? round($totalBalanceAmount / $ticketValue) : 0;

            // Tickets utilisés = Affectés - Tickets restants
            $totalUsed = $totalAssigned - $totalBalanceTickets;

            // Taux d'utilisation en %
            $usageRate = $totalAssigned > 0 ? round(($totalUsed / $totalAssigned) * 100) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_employees' => $totalEmployees,
                        'total_orders' => $totalOrders,
                        'total_spent' => $totalSpent,
                        'tickets_usage_rate' => $usageRate,
                    ],
                    'expenses_by_restaurant' => $expensesByRestaurant,
                    'expenses_by_employee' => array_slice($expensesByEmployee, 0, 10),
                    'monthly_expenses' => $monthlyExpenses,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [DashboardStats] Erreur getCompanyStats', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Statistiques pour le gestionnaire de restaurant
     */
    public function getRestaurantStats(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');

            Log::info('🍽️ [getRestaurantStats] Début', [
                'restaurant_id' => $restaurantId,
            ]);

            if (!$restaurantId) {
                Log::error('🍽️ [getRestaurantStats] Restaurant ID manquant');
                return response()->json(['error' => 'Restaurant ID manquant'], 401);
            }

            // Statistiques générales (seulement commandes confirmées)
            $totalOrders = Order::where('restaurant_id', $restaurantId)
                ->where('status', 'confirmed')
                ->count()
                + DirectPayment::where('restaurant_id', $restaurantId)
                    ->where('status', 'completed')
                    ->count();

            $totalRevenue = (float) Order::where('restaurant_id', $restaurantId)
                ->where('status', 'confirmed')
                ->sum('total_amount')
                + (float) DirectPayment::where('restaurant_id', $restaurantId)
                    ->where('status', 'completed')
                    ->sum('amount');

            $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

            Log::info('🍽️ [getRestaurantStats] Données chargées', [
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
            ]);

            // Commandes par mois (6 derniers mois, seulement confirmées)
            $ordersByMonth = $this->getOrdersByMonthForRestaurant($restaurantId);

            // Revenus par entreprise
            $revenueByCompany = $this->getRevenueByCompanyForRestaurant($restaurantId);

            // Plats les plus commandés
            $topDishes = $this->getTopDishes($restaurantId);

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_orders' => $totalOrders,
                        'total_revenue' => $totalRevenue,
                        'average_order_value' => round($avgOrderValue),
                    ],
                    'orders_by_month' => $ordersByMonth,
                    'revenue_by_company' => $revenueByCompany,
                    'top_dishes' => array_slice($topDishes, 0, 10),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [DashboardStats] Erreur getRestaurantStats', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Statistiques pour l'employé
     */
    public function getEmployeeStats(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');

            if (!$userId) {
                return response()->json(['error' => 'User ID manquant'], 401);
            }

            // Statistiques générales (uniquement commandes confirmées)
            $totalOrders = Order::where('employee_id', $userId)
                ->where('status', 'confirmed')->count()
                + DirectPayment::where('employee_id', $userId)
                    ->where('status', 'completed')
                    ->count();
            $totalSpent = (float) Order::where('employee_id', $userId)
                ->where('status', 'confirmed')->sum('total_amount')
                + (float) DirectPayment::where('employee_id', $userId)
                    ->where('status', 'completed')
                    ->sum('amount');
            $totalAssigned = UserTicket::where('employee_id', $userId)->sum('tickets_count');

            // Utilisation mensuelle (6 derniers mois)
            $monthlyUsage = $this->getMonthlyExpensesForEmployee($userId);

            // Restaurants favoris
            $favoriteRestaurants = $this->getFavoriteRestaurants($userId);

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_orders' => $totalOrders,
                        'total_spent' => $totalSpent,
                        'tickets_assigned' => $totalAssigned,
                    ],
                    'monthly_usage' => $monthlyUsage,
                    'favorite_restaurants' => array_slice($favoriteRestaurants, 0, 5),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [DashboardStats] Erreur getEmployeeStats', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // =============== Méthodes utilitaires SQL ===============

    /**
     * Commandes par mois (pour Admin - toutes les commandes)
     */
    private function getOrdersByMonth($months = 6)
    {
        $result = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $startOfMonth = now()->subMonths($i)->startOfMonth();
            $endOfMonth = now()->subMonths($i)->endOfMonth();

            $stats = Order::where('status', 'confirmed')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->selectRaw('COUNT(*) as count, SUM(total_amount) as amount')
                ->first();

            $dpStats = DirectPayment::where('status', 'completed')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->selectRaw('COUNT(*) as count, SUM(amount) as amount')
                ->first();

            $result[] = [
                'month' => $startOfMonth->format('M'),
                'orders' => (int) ($stats->count ?? 0) + (int) ($dpStats->count ?? 0),
                'amount' => (float) ($stats->amount ?? 0) + (float) ($dpStats->amount ?? 0),
            ];
        }
        return $result;
    }

    /**
     * Top restaurants par revenue (pour Admin)
     */
    private function getTopRestaurantsByRevenue()
    {
        $orderStats = Order::select('restaurant_id')
            ->where('status', 'confirmed')
            ->selectRaw('COUNT(*) as orders')
            ->selectRaw('SUM(total_amount) as revenue')
            ->groupBy('restaurant_id')
            ->get();

        $dpStats = DirectPayment::select('restaurant_id')
            ->where('status', 'completed')
            ->selectRaw('COUNT(*) as orders')
            ->selectRaw('SUM(amount) as revenue')
            ->groupBy('restaurant_id')
            ->get();

        $byRestaurant = [];
        foreach ($orderStats as $stat) {
            $rid = (string) $stat->restaurant_id;
            $byRestaurant[$rid] = [
                'restaurant_id' => $stat->restaurant_id,
                'orders' => (int) $stat->orders,
                'revenue' => (float) $stat->revenue,
            ];
        }
        foreach ($dpStats as $stat) {
            $rid = (string) $stat->restaurant_id;
            if (!isset($byRestaurant[$rid])) {
                $byRestaurant[$rid] = [
                    'restaurant_id' => $stat->restaurant_id,
                    'orders' => 0,
                    'revenue' => 0.0,
                ];
            }
            $byRestaurant[$rid]['orders'] += (int) $stat->orders;
            $byRestaurant[$rid]['revenue'] += (float) $stat->revenue;
        }

        $result = [];
        $restaurants = Restaurant::all()->keyBy('id');
        foreach ($byRestaurant as $row) {
            $restaurant = $restaurants->get($row['restaurant_id']);
            if (!$restaurant) continue;
            $result[] = [
                'restaurant_id' => $row['restaurant_id'],
                'restaurant_name' => $restaurant->name,
                'orders' => (int) $row['orders'],
                'revenue' => (float) $row['revenue'],
            ];
        }

        usort($result, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
        return $result;
    }

    /**
     * Commandes par entreprise (pour Admin)
     */
    private function getOrdersByCompany()
    {
        $stats = Order::join('employees', 'orders.employee_id', '=', 'employees.id')
            ->where('orders.status', 'confirmed')
            ->select('employees.company_id')
            ->selectRaw('COUNT(orders.id) as orders_count')
            ->selectRaw('SUM(orders.total_amount) as total_amount')
            ->groupBy('employees.company_id')
            ->get();

        $dpStats = DirectPayment::where('status', 'completed')
            ->select('company_id')
            ->selectRaw('COUNT(id) as orders_count')
            ->selectRaw('SUM(amount) as total_amount')
            ->groupBy('company_id')
            ->get();

        $byCompany = [];
        foreach ($stats as $stat) {
            $cid = (string) $stat->company_id;
            $byCompany[$cid] = [
                'company_id' => $stat->company_id,
                'orders' => (int) $stat->orders_count,
                'amount' => (float) $stat->total_amount,
            ];
        }
        foreach ($dpStats as $stat) {
            $cid = (string) $stat->company_id;
            if (!isset($byCompany[$cid])) {
                $byCompany[$cid] = [
                    'company_id' => $stat->company_id,
                    'orders' => 0,
                    'amount' => 0.0,
                ];
            }
            $byCompany[$cid]['orders'] += (int) $stat->orders_count;
            $byCompany[$cid]['amount'] += (float) $stat->total_amount;
        }

        $result = [];
        $companies = Company::all()->keyBy('id');
        foreach ($byCompany as $row) {
            $company = $companies->get($row['company_id']);
            if (!$company) continue;
            $result[] = [
                'company_id' => $row['company_id'],
                'company_name' => $company->name,
                'orders' => (int) $row['orders'],
                'amount' => (float) $row['amount'],
            ];
        }

        usort($result, fn($a, $b) => $b['orders'] <=> $a['orders']);
        return $result;
    }

    /**
     * Tickets affectés par mois et par entreprise (pour Admin)
     */
    private function getTicketsByMonthAndCompany()
    {
        // Créer un tableau des 6 derniers mois
        $monthsData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthsData[] = [
                'month' => $date->format('M y'),
                'month_key' => $date->format('Y-m'),
            ];
        }

        // Récupérer les tickets par mois et par entreprise via la jointure
        $tickets = UserTicket::join('employees', 'user_tickets.employee_id', '=', 'employees.id')
            ->join('companies', 'employees.company_id', '=', 'companies.id')
            ->selectRaw('DATE_FORMAT(user_tickets.created_at, "%Y-%m") as month')
            ->selectRaw('companies.name as company_name')
            ->selectRaw('SUM(user_tickets.tickets_count) as total_tickets')
            ->groupBy(DB::raw('DATE_FORMAT(user_tickets.created_at, "%Y-%m")'), 'companies.name')
            ->get();

        // Indexer par mois et entreprise
        $ticketsByMonth = [];
        foreach ($tickets as $ticket) {
            if (!isset($ticketsByMonth[$ticket->month])) {
                $ticketsByMonth[$ticket->month] = [];
            }
            $ticketsByMonth[$ticket->month][$ticket->company_name] = (int) $ticket->total_tickets;
        }

        // Construire le résultat final avec tous les mois
        $result = [];
        foreach ($monthsData as $monthData) {
            $row = ['month' => $monthData['month']];

            if (isset($ticketsByMonth[$monthData['month_key']])) {
                foreach ($ticketsByMonth[$monthData['month_key']] as $companyName => $count) {
                    $row[$companyName] = $count;
                }
            }

            $result[] = $row;
        }

        return $result;
    }

    /**
     * Dépenses par restaurant (pour Company)
     */
    private function getExpensesByRestaurant(array $employeeIds)
    {
        $orderStats = Order::whereIn('employee_id', $employeeIds)
            ->where('status', 'confirmed')
            ->select('restaurant_id')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('SUM(total_amount) as amount')
            ->groupBy('restaurant_id')
            ->get();

        $dpStats = DirectPayment::whereIn('employee_id', $employeeIds)
            ->where('status', 'completed')
            ->select('restaurant_id')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('SUM(amount) as amount')
            ->groupBy('restaurant_id')
            ->get();

        $result = [];
        $restaurants = Restaurant::all()->keyBy('id');

        $byRestaurant = [];
        foreach ($orderStats as $stat) {
            $rid = (string) $stat->restaurant_id;
            $byRestaurant[$rid] = [
                'restaurant_id' => $stat->restaurant_id,
                'orders' => (int) $stat->orders_count,
                'amount' => (float) $stat->amount,
            ];
        }
        foreach ($dpStats as $stat) {
            $rid = (string) $stat->restaurant_id;
            if (!isset($byRestaurant[$rid])) {
                $byRestaurant[$rid] = [
                    'restaurant_id' => $stat->restaurant_id,
                    'orders' => 0,
                    'amount' => 0.0,
                ];
            }
            $byRestaurant[$rid]['orders'] += (int) $stat->orders_count;
            $byRestaurant[$rid]['amount'] += (float) $stat->amount;
        }

        foreach ($byRestaurant as $row) {
            $restaurant = $restaurants->get($row['restaurant_id']);
            if (!$restaurant) continue; // Ignorer les restaurants supprimés
            $result[] = [
                'name' => $restaurant->name,
                'amount' => (float) $row['amount'],
                'orders' => (int) $row['orders'],
            ];
        }

        return $result;
    }

    /**
     * Dépenses par employé (pour Company)
     */
    private function getExpensesByEmployee(array $employeeIds)
    {
        $orderStats = Order::whereIn('employee_id', $employeeIds)
            ->where('status', 'confirmed')
            ->select('employee_id', 'employee_name')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('SUM(total_amount) as amount')
            ->groupBy('employee_id', 'employee_name')
            ->get();

        $dpStats = DirectPayment::whereIn('employee_id', $employeeIds)
            ->where('status', 'completed')
            ->select('employee_id', 'employee_name')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('SUM(amount) as amount')
            ->groupBy('employee_id', 'employee_name')
            ->get();

        $byEmployee = [];
        foreach ($orderStats as $stat) {
            $eid = (string) $stat->employee_id;
            $byEmployee[$eid] = [
                'name' => $stat->employee_name,
                'orders' => (int) $stat->orders_count,
                'amount' => (float) $stat->amount,
            ];
        }
        foreach ($dpStats as $stat) {
            $eid = (string) $stat->employee_id;
            if (!isset($byEmployee[$eid])) {
                $byEmployee[$eid] = [
                    'name' => $stat->employee_name,
                    'orders' => 0,
                    'amount' => 0.0,
                ];
            }
            $byEmployee[$eid]['orders'] += (int) $stat->orders_count;
            $byEmployee[$eid]['amount'] += (float) $stat->amount;
        }

        $result = array_values($byEmployee);
        usort($result, fn($a, $b) => $b['amount'] <=> $a['amount']);
        return $result;
    }

    /**
     * Évolution mensuelle des dépenses (pour Company)
     */
    private function getMonthlyExpenses(array $employeeIds, $months = 6)
    {
        $result = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $startOfMonth = now()->subMonths($i)->startOfMonth();
            $endOfMonth = now()->subMonths($i)->endOfMonth();

            $amount = (float) Order::whereIn('employee_id', $employeeIds)
                ->where('status', 'confirmed')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('total_amount')
                + (float) DirectPayment::whereIn('employee_id', $employeeIds)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('amount');

            $result[] = [
                'month' => $startOfMonth->format('M'),
                'amount' => $amount,
            ];
        }
        return $result;
    }

    /**
     * Commandes par mois pour un restaurant spécifique
     */
    private function getOrdersByMonthForRestaurant($restaurantId, $months = 6)
    {
        $result = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $startOfMonth = now()->subMonths($i)->startOfMonth();
            $endOfMonth = now()->subMonths($i)->endOfMonth();

            $stats = Order::where('restaurant_id', $restaurantId)
                ->where('status', 'confirmed')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->selectRaw('COUNT(*) as count, SUM(total_amount) as amount')
                ->first();

            $dpStats = DirectPayment::where('restaurant_id', $restaurantId)
                ->where('status', 'completed')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->selectRaw('COUNT(*) as count, SUM(amount) as amount')
                ->first();

            $result[] = [
                'month' => $startOfMonth->format('M'),
                'orders' => (int)($stats->count ?? 0) + (int)($dpStats->count ?? 0),
                'amount' => (float)($stats->amount ?? 0) + (float)($dpStats->amount ?? 0),
            ];
        }
        return $result;
    }

    /**
     * Revenus par entreprise pour un restaurant
     */
    private function getRevenueByCompanyForRestaurant($restaurantId)
    {
        $stats = Order::where('orders.restaurant_id', $restaurantId)
            ->where('orders.status', 'confirmed')
            ->join('employees', 'orders.employee_id', '=', 'employees.id')
            ->join('companies', 'employees.company_id', '=', 'companies.id')
            ->select('companies.name as company_name')
            ->selectRaw('COUNT(orders.id) as orders_count')
            ->selectRaw('SUM(orders.total_amount) as amount')
            ->groupBy('companies.name')
            ->get();

        $dpStats = DirectPayment::where('direct_payments.restaurant_id', $restaurantId)
            ->where('direct_payments.status', 'completed')
            ->join('companies', 'direct_payments.company_id', '=', 'companies.id')
            ->select('companies.name as company_name')
            ->selectRaw('COUNT(direct_payments.id) as orders_count')
            ->selectRaw('SUM(direct_payments.amount) as amount')
            ->groupBy('companies.name')
            ->get();

        $byCompany = [];
        foreach ($stats as $stat) {
            $key = (string) $stat->company_name;
            $byCompany[$key] = [
                'name' => $stat->company_name,
                'amount' => (float) $stat->amount,
                'orders' => (int) $stat->orders_count,
            ];
        }
        foreach ($dpStats as $stat) {
            $key = (string) $stat->company_name;
            if (!isset($byCompany[$key])) {
                $byCompany[$key] = [
                    'name' => $stat->company_name,
                    'amount' => 0.0,
                    'orders' => 0,
                ];
            }
            $byCompany[$key]['amount'] += (float) $stat->amount;
            $byCompany[$key]['orders'] += (int) $stat->orders_count;
        }

        $result = array_values($byCompany);
        usort($result, fn($a, $b) => $b['amount'] <=> $a['amount']);
        return $result;
    }

    /**
     * Top plats les plus commandés (pour Restaurant)
     */
    private function getTopDishes($restaurantId)
    {
        // Récupérer toutes les commandes confirmées du restaurant
        $orders = Order::where('restaurant_id', $restaurantId)
            ->where('status', 'confirmed')
            ->get();

        $dishes = [];

        // Parcourir les items JSON de chaque commande
        foreach ($orders as $order) {
            $items = $order->items ?? []; // Le cast array est automatique

            foreach ($items as $item) {
                $name = $item['name'] ?? 'Plat inconnu';
                $quantity = $item['quantity'] ?? 0;
                $price = $item['price'] ?? 0;

                if (!isset($dishes[$name])) {
                    $dishes[$name] = [
                        'name' => $name,
                        'quantity' => 0,
                        'revenue' => 0,
                        'orders_count' => 0
                    ];
                }

                $dishes[$name]['quantity'] += $quantity;
                $dishes[$name]['revenue'] += $price * $quantity;
                $dishes[$name]['orders_count'] += 1;
            }
        }

        // Trier par quantité décroissante
        $dishesArray = array_values($dishes);
        usort($dishesArray, fn($a, $b) => $b['quantity'] - $a['quantity']);

        return array_slice($dishesArray, 0, 10);
    }

    /**
     * Utilisation mensuelle pour un employé
     */
    private function getMonthlyExpensesForEmployee($employeeId, $months = 6)
    {
        $result = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $startOfMonth = now()->subMonths($i)->startOfMonth();
            $endOfMonth = now()->subMonths($i)->endOfMonth();

            $amount = (float) Order::where('employee_id', $employeeId)
                ->where('status', 'confirmed')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->sum('total_amount')
                + (float) DirectPayment::where('employee_id', $employeeId)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->sum('amount');

            $result[] = [
                'month' => $startOfMonth->format('M'),
                'amount' => (float) $amount,
            ];
        }
        return $result;
    }

    /**
     * Restaurants favoris d'un employé
     */
    private function getFavoriteRestaurants($employeeId)
    {
        $orderStats = Order::where('employee_id', $employeeId)
            ->where('status', 'confirmed')
            ->select('restaurant_id')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('SUM(total_amount) as amount')
            ->groupBy('restaurant_id')
            ->get();

        $dpStats = DirectPayment::where('employee_id', $employeeId)
            ->where('status', 'completed')
            ->select('restaurant_id')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('SUM(amount) as amount')
            ->groupBy('restaurant_id')
            ->get();

        $byRestaurant = [];
        foreach ($orderStats as $stat) {
            $rid = (string) $stat->restaurant_id;
            $byRestaurant[$rid] = [
                'restaurant_id' => $stat->restaurant_id,
                'orders' => (int) $stat->orders_count,
                'amount' => (float) $stat->amount,
            ];
        }
        foreach ($dpStats as $stat) {
            $rid = (string) $stat->restaurant_id;
            if (!isset($byRestaurant[$rid])) {
                $byRestaurant[$rid] = [
                    'restaurant_id' => $stat->restaurant_id,
                    'orders' => 0,
                    'amount' => 0.0,
                ];
            }
            $byRestaurant[$rid]['orders'] += (int) $stat->orders_count;
            $byRestaurant[$rid]['amount'] += (float) $stat->amount;
        }

        $result = [];
        $restaurants = Restaurant::all()->keyBy('id');

        foreach ($byRestaurant as $row) {
            $restaurant = $restaurants->get($row['restaurant_id']);
            if (!$restaurant) continue; // Ignorer les restaurants supprimés
            $result[] = [
                'name' => $restaurant->name,
                'orders' => (int) $row['orders'],
                'amount' => (float) $row['amount'],
            ];
        }

        usort($result, fn($a, $b) => $b['orders'] <=> $a['orders']);

        return $result;
    }
}
