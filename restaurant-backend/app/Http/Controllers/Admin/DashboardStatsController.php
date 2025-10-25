<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DashboardStatsController extends Controller
{
    private $employeesFile = 'employees.json';
    private $companiesFile = 'companies.json';
    private $restaurantsFile = 'restaurants.json';
    private $ordersFile = 'orders.json';
    private $batchesFile = 'ticket_batches.json';
    private $assignmentsFile = 'ticket_assignments.json';

    /**
     * Statistiques pour l'administrateur système
     */
    public function getAdminStats(Request $request)
    {
        try {
            // Charger depuis JSON
            $employees = $this->loadFile($this->employeesFile);
            $orders = $this->loadFile($this->ordersFile);
            $batches = $this->loadFile($this->batchesFile);
            $assignments = $this->loadFile($this->assignmentsFile);
            
            // Charger depuis BDD
            $companies = Company::all()->toArray();
            $restaurants = Restaurant::all()->toArray();

            \Log::info('📊 [DashboardStats] Fichiers chargés', [
                'employees' => count($employees),
                'companies' => count($companies),
                'restaurants' => count($restaurants),
                'orders' => count($orders),
                'batches' => count($batches),
                'assignments' => count($assignments),
            ]);

            // Statistiques générales
            $totalUsers = count($employees);
            $totalCompanies = count($companies);
            $totalRestaurants = count($restaurants);
            $totalOrders = count($orders);

            // Répartition par rôle
            $usersByRole = [];
            foreach ($employees as $emp) {
                $role = $emp['role'] ?? 'Utilisateur';
                $usersByRole[$role] = ($usersByRole[$role] ?? 0) + 1;
            }

            // Tickets émis
            $totalTicketsIssued = array_sum(array_column($assignments, 'tickets_count'));
            $totalTicketsValue = 0;
            foreach ($assignments as $assignment) {
                $totalTicketsValue += ($assignment['tickets_count'] * $assignment['ticket_value']);
            }

            // Commandes par mois (6 derniers mois)
            $ordersByMonth = $this->getOrdersByMonth($orders, 6);

            // Restaurants les plus actifs
            $restaurantStats = $this->getTopRestaurantsByRevenue($orders, $restaurants);

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
                ]
            ]);
        } catch (\Exception $e) {
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

            $employees = $this->loadFile($this->employeesFile);
            $orders = $this->loadFile($this->ordersFile);
            $assignments = $this->loadFile($this->assignmentsFile);

            // Filtrer les données de l'entreprise
            $companyEmployees = array_filter($employees, fn($e) => ($e['company_id'] ?? '') === $companyId);
            $companyOrders = array_filter($orders, fn($o) => ($o['company_id'] ?? '') === $companyId);
            $companyAssignments = array_filter($assignments, fn($a) => ($a['company_id'] ?? '') === $companyId);

            // Dépenses par restaurant
            $expensesByRestaurant = $this->getExpensesByRestaurant($companyOrders);

            // Dépenses par employé
            $expensesByEmployee = $this->getExpensesByEmployee($companyOrders, $companyEmployees);

            // Évolution mensuelle
            $monthlyExpenses = $this->getMonthlyExpenses($companyOrders, 6);

            // Taux d'utilisation des tickets
            $totalAssigned = array_sum(array_column($companyAssignments, 'tickets_count'));
            $totalUsed = 0;
            foreach ($companyEmployees as $emp) {
                $balance = $emp['ticket_balance'] ?? 0;
                $totalUsed += $totalAssigned - $balance;
            }
            $usageRate = $totalAssigned > 0 ? round(($totalUsed / $totalAssigned) * 100) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_employees' => count($companyEmployees),
                        'total_orders' => count($companyOrders),
                        'total_spent' => array_sum(array_column($companyOrders, 'total_amount')),
                        'tickets_usage_rate' => $usageRate,
                    ],
                    'expenses_by_restaurant' => $expensesByRestaurant,
                    'expenses_by_employee' => array_slice($expensesByEmployee, 0, 10),
                    'monthly_expenses' => $monthlyExpenses,
                ]
            ]);
        } catch (\Exception $e) {
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
            
            if (!$restaurantId) {
                return response()->json(['error' => 'Restaurant ID manquant'], 401);
            }

            $orders = $this->loadFile($this->ordersFile);
            $restaurants = $this->loadFile($this->restaurantsFile);

            // Filtrer les commandes du restaurant
            $restaurantOrders = array_filter($orders, fn($o) => ($o['restaurant_id'] ?? '') === $restaurantId);

            // Commandes par mois
            $ordersByMonth = $this->getOrdersByMonth($restaurantOrders, 6);

            // Revenus par entreprise
            $revenueByCompany = $this->getRevenueByCompany($restaurantOrders);

            // Plats les plus commandés
            $topDishes = $this->getTopDishes($restaurantOrders);

            // Statistiques générales
            $totalRevenue = array_sum(array_column($restaurantOrders, 'total_amount'));
            $avgOrderValue = count($restaurantOrders) > 0 ? $totalRevenue / count($restaurantOrders) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_orders' => count($restaurantOrders),
                        'total_revenue' => $totalRevenue,
                        'average_order_value' => round($avgOrderValue),
                    ],
                    'orders_by_month' => $ordersByMonth,
                    'revenue_by_company' => $revenueByCompany,
                    'top_dishes' => array_slice($topDishes, 0, 10),
                ]
            ]);
        } catch (\Exception $e) {
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

            $orders = $this->loadFile($this->ordersFile);
            $assignments = $this->loadFile($this->assignmentsFile);

            // Filtrer les commandes de l'employé
            $userOrders = array_filter($orders, fn($o) => ($o['employee_id'] ?? '') === $userId);

            // Utilisation mensuelle
            $monthlyUsage = $this->getMonthlyExpenses($userOrders, 6);

            // Restaurants favoris
            $favoriteRestaurants = $this->getFavoriteRestaurants($userOrders);

            // Tickets assignés
            $userAssignments = array_filter($assignments, fn($a) => ($a['employee_id'] ?? '') === $userId);
            $totalAssigned = array_sum(array_column($userAssignments, 'tickets_count'));
            $totalSpent = array_sum(array_column($userOrders, 'total_amount'));

            return response()->json([
                'success' => true,
                'data' => [
                    'overview' => [
                        'total_orders' => count($userOrders),
                        'total_spent' => $totalSpent,
                        'tickets_assigned' => $totalAssigned,
                    ],
                    'monthly_usage' => $monthlyUsage,
                    'favorite_restaurants' => array_slice($favoriteRestaurants, 0, 5),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Méthodes utilitaires

    private function loadFile($filename)
    {
        try {
            $path = storage_path("app/{$filename}");
            
            if (!file_exists($path)) {
                \Log::warning("⚠️ Fichier non trouvé: {$path}");
                return [];
            }
            
            $content = file_get_contents($path);
            $data = json_decode($content, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                \Log::error("❌ Erreur JSON dans {$filename}: " . json_last_error_msg());
                return [];
            }
            
            \Log::info("✅ Fichier chargé: {$filename} - " . count($data ?? []) . " éléments");
            return $data ?? [];
        } catch (\Exception $e) {
            \Log::error("❌ Erreur chargement {$filename}: " . $e->getMessage());
            return [];
        }
    }

    private function getOrdersByMonth($orders, $months = 6)
    {
        $result = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = date('Y-m', strtotime("-$i months"));
            $monthName = date('M', strtotime("-$i months"));
            
            $monthOrders = array_filter($orders, function($o) use ($month) {
                return isset($o['created_at']) && strpos($o['created_at'], $month) === 0;
            });
            
            $result[] = [
                'month' => $monthName,
                'orders' => count($monthOrders),
                'amount' => array_sum(array_column($monthOrders, 'total_amount')),
            ];
        }
        return $result;
    }

    private function getTopRestaurantsByRevenue($orders, $restaurants)
    {
        $stats = [];
        foreach ($orders as $order) {
            $rid = $order['restaurant_id'] ?? '';
            if (!isset($stats[$rid])) {
                $restaurant = collect($restaurants)->firstWhere('id', $rid);
                $stats[$rid] = [
                    'restaurant_id' => $rid,
                    'restaurant_name' => $restaurant['name'] ?? 'Inconnu',
                    'orders' => 0,
                    'revenue' => 0,
                ];
            }
            $stats[$rid]['orders']++;
            $stats[$rid]['revenue'] += $order['total_amount'] ?? 0;
        }
        usort($stats, fn($a, $b) => $b['revenue'] - $a['revenue']);
        return array_values($stats);
    }

    private function getExpensesByRestaurant($orders)
    {
        $expenses = [];
        foreach ($orders as $order) {
            $rid = $order['restaurant_id'] ?? 'unknown';
            $rname = $order['restaurant_name'] ?? 'Inconnu';
            if (!isset($expenses[$rid])) {
                $expenses[$rid] = ['name' => $rname, 'amount' => 0, 'orders' => 0];
            }
            $expenses[$rid]['amount'] += $order['total_amount'] ?? 0;
            $expenses[$rid]['orders']++;
        }
        return array_values($expenses);
    }

    private function getExpensesByEmployee($orders, $employees)
    {
        $expenses = [];
        foreach ($orders as $order) {
            $eid = $order['employee_id'] ?? '';
            if (!isset($expenses[$eid])) {
                $employee = collect($employees)->firstWhere('id', $eid);
                $expenses[$eid] = [
                    'name' => $employee['name'] ?? 'Inconnu',
                    'amount' => 0,
                    'orders' => 0,
                ];
            }
            $expenses[$eid]['amount'] += $order['total_amount'] ?? 0;
            $expenses[$eid]['orders']++;
        }
        usort($expenses, fn($a, $b) => $b['amount'] - $a['amount']);
        return array_values($expenses);
    }

    private function getMonthlyExpenses($orders, $months = 6)
    {
        $result = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = date('Y-m', strtotime("-$i months"));
            $monthName = date('M', strtotime("-$i months"));
            
            $monthOrders = array_filter($orders, function($o) use ($month) {
                return isset($o['created_at']) && strpos($o['created_at'], $month) === 0;
            });
            
            $result[] = [
                'month' => $monthName,
                'amount' => array_sum(array_column($monthOrders, 'total_amount')),
            ];
        }
        return $result;
    }

    private function getRevenueByCompany($orders)
    {
        $revenue = [];
        foreach ($orders as $order) {
            $cid = $order['company_id'] ?? 'unknown';
            $cname = $order['company_name'] ?? 'Inconnu';
            if (!isset($revenue[$cid])) {
                $revenue[$cid] = ['name' => $cname, 'amount' => 0];
            }
            $revenue[$cid]['amount'] += $order['total_amount'] ?? 0;
        }
        return array_values($revenue);
    }

    private function getTopDishes($orders)
    {
        $dishes = [];
        foreach ($orders as $order) {
            foreach ($order['items'] ?? [] as $item) {
                $name = $item['name'] ?? 'Inconnu';
                if (!isset($dishes[$name])) {
                    $dishes[$name] = ['name' => $name, 'quantity' => 0, 'revenue' => 0];
                }
                $dishes[$name]['quantity'] += $item['quantity'] ?? 0;
                $dishes[$name]['revenue'] += ($item['price'] ?? 0) * ($item['quantity'] ?? 0);
            }
        }
        usort($dishes, fn($a, $b) => $b['quantity'] - $a['quantity']);
        return array_values($dishes);
    }

    private function getFavoriteRestaurants($orders)
    {
        $restaurants = [];
        foreach ($orders as $order) {
            $rid = $order['restaurant_id'] ?? '';
            $rname = $order['restaurant_name'] ?? 'Inconnu';
            if (!isset($restaurants[$rid])) {
                $restaurants[$rid] = ['name' => $rname, 'orders' => 0, 'amount' => 0];
            }
            $restaurants[$rid]['orders']++;
            $restaurants[$rid]['amount'] += $order['total_amount'] ?? 0;
        }
        usort($restaurants, fn($a, $b) => $b['orders'] - $a['orders']);
        return array_values($restaurants);
    }

}
