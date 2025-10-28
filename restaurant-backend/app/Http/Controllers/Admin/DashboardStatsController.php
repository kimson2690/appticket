<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Restaurant;
use App\Models\User;
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

            // Charger les utilisateurs de la BDD (admins, gestionnaires)
            $usersFromDB = User::all();
            
            // Statistiques générales
            $totalUsers = count($employees) + count($usersFromDB);
            $totalCompanies = count($companies);
            $totalRestaurants = count($restaurants);
            $totalOrders = count($orders);

            // Répartition par rôle - Combiner BDD + JSON
            $usersByRole = [];
            
            // Compter les utilisateurs de la BDD (gestionnaires, admins)
            foreach ($usersFromDB as $user) {
                // $user->role est une relation, on doit accéder à ->name
                $role = $user->role->name ?? 'Utilisateur';
                $usersByRole[$role] = ($usersByRole[$role] ?? 0) + 1;
            }
            
            // Compter les employés du JSON
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
            
            // Commandes par entreprise
            $ordersByCompany = $this->getOrdersByCompany($orders, $companies);
            
            // Tickets affectés par mois et par entreprise
            $ticketsByMonthAndCompany = $this->getTicketsByMonthAndCompany($assignments, $companies);

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

            // Filtrer les employés de l'entreprise
            $companyEmployees = array_filter($employees, fn($e) => ($e['company_id'] ?? '') === $companyId);
            
            // Créer un index des IDs d'employés de l'entreprise
            $companyEmployeeIds = array_column($companyEmployees, 'id');
            
            // Filtrer les commandes des employés de l'entreprise (via employee_id)
            $companyOrders = array_filter($orders, fn($o) => in_array($o['employee_id'] ?? '', $companyEmployeeIds));
            
            // Filtrer les affectations des employés de l'entreprise (via employee_id)
            $companyAssignments = array_filter($assignments, fn($a) => in_array($a['employee_id'] ?? '', $companyEmployeeIds));

            // Dépenses par restaurant
            $expensesByRestaurant = $this->getExpensesByRestaurant($companyOrders);

            // Dépenses par employé
            $expensesByEmployee = $this->getExpensesByEmployee($companyOrders, $companyEmployees);

            // Évolution mensuelle
            $monthlyExpenses = $this->getMonthlyExpenses($companyOrders, 6);

            // Taux d'utilisation des tickets
            $totalAssigned = array_sum(array_column($companyAssignments, 'tickets_count'));
            
            // Obtenir la valeur d'un ticket (depuis la première affectation)
            $ticketValue = 500; // Valeur par défaut
            if (!empty($companyAssignments)) {
                $ticketValue = $companyAssignments[0]['ticket_value'] ?? 500;
            }
            
            // Calculer le solde total restant de tous les employés (en valeur monétaire)
            $totalBalanceAmount = 0;
            foreach ($companyEmployees as $emp) {
                $totalBalanceAmount += $emp['ticket_balance'] ?? 0;
            }
            
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
            
            \Log::info('🍽️ [getRestaurantStats] Début', [
                'restaurant_id' => $restaurantId,
            ]);
            
            if (!$restaurantId) {
                \Log::error('🍽️ [getRestaurantStats] Restaurant ID manquant');
                return response()->json(['error' => 'Restaurant ID manquant'], 401);
            }

            $orders = $this->loadFile($this->ordersFile);
            $restaurants = $this->loadFile($this->restaurantsFile);
            
            \Log::info('🍽️ [getRestaurantStats] Fichiers chargés', [
                'orders_count' => count($orders),
                'restaurants_count' => count($restaurants),
            ]);

            // Filtrer les commandes du restaurant (seulement les validées)
            $restaurantOrders = array_filter($orders, function($o) use ($restaurantId) {
                return ($o['restaurant_id'] ?? '') === $restaurantId 
                    && ($o['status'] ?? '') === 'confirmed';
            });
            
            \Log::info('🍽️ [getRestaurantStats] Commandes filtrées', [
                'total_orders' => count($restaurantOrders),
                'restaurant_id' => $restaurantId,
            ]);

            // Commandes par mois
            $ordersByMonth = $this->getOrdersByMonth($restaurantOrders, 6);

            // Revenus par entreprise
            $revenueByCompany = $this->getRevenueByCompany($restaurantOrders);

            // Plats les plus commandés
            try {
                \Log::info('🍽️ [getRestaurantStats] Chargement des plats...');
                $topDishes = $this->getTopDishes($restaurantOrders);
                \Log::info('🍽️ [getRestaurantStats] Plats chargés', [
                    'count' => count($topDishes),
                ]);
            } catch (\Exception $e) {
                \Log::error('🍽️ [getRestaurantStats] Erreur getTopDishes', [
                    'error' => $e->getMessage(),
                ]);
                // En cas d'erreur, renvoyer un tableau vide au lieu de crasher
                $topDishes = [];
            }

            // Statistiques générales (seulement commandes confirmées)
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

    private function getOrdersByCompany($orders, $companies)
    {
        // Charger les employés pour obtenir le company_id
        $employees = $this->loadFile($this->employeesFile);
        $employeesById = [];
        foreach ($employees as $emp) {
            $employeesById[$emp['id']] = $emp;
        }
        
        $stats = [];
        foreach ($orders as $order) {
            // Récupérer le company_id depuis l'employé
            $employeeId = $order['employee_id'] ?? '';
            $employee = $employeesById[$employeeId] ?? null;
            $cid = $employee['company_id'] ?? '';
            
            if (!$cid) continue; // Ignorer les commandes sans entreprise
            
            if (!isset($stats[$cid])) {
                $company = collect($companies)->firstWhere('id', (string)$cid);
                $stats[$cid] = [
                    'company_id' => $cid,
                    'company_name' => $company['name'] ?? 'Inconnue',
                    'orders' => 0,
                    'amount' => 0,
                ];
            }
            $stats[$cid]['orders']++;
            $stats[$cid]['amount'] += $order['total_amount'] ?? 0;
        }
        usort($stats, fn($a, $b) => $b['orders'] - $a['orders']);
        return array_values($stats);
    }

    private function getTicketsByMonthAndCompany($assignments, $companies)
    {
        \Log::info('🎫 [getTicketsByMonthAndCompany] Début', [
            'assignments_count' => count($assignments),
            'companies_count' => count($companies),
        ]);
        
        // Charger les employés pour obtenir le company_id
        $employees = $this->loadFile($this->employeesFile);
        $employeesById = [];
        foreach ($employees as $emp) {
            $employeesById[$emp['id']] = $emp;
        }
        
        \Log::info('🎫 [getTicketsByMonthAndCompany] Employés chargés', [
            'employees_count' => count($employees),
        ]);
        
        // Créer un tableau des mois (6 derniers mois)
        $monthsData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = date('Y-m', strtotime("-$i months"));
            $monthName = date('M y', strtotime("-$i months"));
            $monthsData[] = [
                'month' => $monthName,
                'month_key' => $month,
            ];
        }
        
        \Log::info('🎫 [getTicketsByMonthAndCompany] Mois générés', [
            'months' => array_column($monthsData, 'month_key'),
        ]);

        // Index des entreprises
        $companiesById = [];
        foreach ($companies as $company) {
            $companiesById[$company['id']] = $company['name'];
        }

        // Grouper les affectations par mois et par entreprise
        $ticketsByMonth = [];
        foreach ($assignments as $assignment) {
            $createdAt = $assignment['created_at'] ?? '';
            $employeeId = $assignment['employee_id'] ?? '';
            $ticketsCount = $assignment['tickets_count'] ?? 0;

            if (!$createdAt || !$employeeId) continue;

            // Récupérer le company_id depuis l'employé
            $employee = $employeesById[$employeeId] ?? null;
            $companyId = $employee['company_id'] ?? '';
            
            if (!$companyId) continue;

            $month = date('Y-m', strtotime($createdAt));
            $monthName = date('M y', strtotime($createdAt));

            if (!isset($ticketsByMonth[$month])) {
                $ticketsByMonth[$month] = [
                    'month' => $monthName,
                ];
            }

            $companyName = $companiesById[$companyId] ?? 'Inconnue';
            if (!isset($ticketsByMonth[$month][$companyName])) {
                $ticketsByMonth[$month][$companyName] = 0;
            }
            $ticketsByMonth[$month][$companyName] += $ticketsCount;
        }

        \Log::info('🎫 [getTicketsByMonthAndCompany] Données groupées par mois', [
            'ticketsByMonth_keys' => array_keys($ticketsByMonth),
            'ticketsByMonth' => $ticketsByMonth,
        ]);
        
        // Construire le résultat final avec tous les mois
        $result = [];
        foreach ($monthsData as $monthData) {
            $monthKey = $monthData['month_key'];
            $monthName = $monthData['month'];
            
            $row = ['month' => $monthName];
            
            // Ajouter les tickets de chaque entreprise pour ce mois
            if (isset($ticketsByMonth[$monthKey])) {
                foreach ($ticketsByMonth[$monthKey] as $key => $value) {
                    if ($key !== 'month') {
                        $row[$key] = $value;
                    }
                }
            }
            
            $result[] = $row;
        }

        \Log::info('🎫 [getTicketsByMonthAndCompany] Résultat final', [
            'result_count' => count($result),
            'result' => $result,
        ]);

        return $result;
    }

    private function getExpensesByRestaurant($orders)
    {
        // Charger les restaurants depuis la BDD (plus fiable que le JSON)
        $restaurants = \App\Models\Restaurant::all()->toArray();
        
        $expenses = [];
        foreach ($orders as $order) {
            $rid = $order['restaurant_id'] ?? 'unknown';
            
            // Priorité 1: Utiliser restaurant_name des items de la commande
            $rname = 'Inconnu';
            if (!empty($order['items'][0]['restaurant_name'])) {
                $rname = $order['items'][0]['restaurant_name'];
            } else {
                // Priorité 2: Chercher dans restaurants.json
                $restaurant = collect($restaurants)->firstWhere('id', $rid);
                
                // Si pas trouvé, essayer avec le préfixe rest_*_
                if (!$restaurant) {
                    $restaurant = collect($restaurants)->first(function($r) use ($rid) {
                        return str_ends_with($r['id'], '_' . $rid);
                    });
                }
                
                if ($restaurant && !empty($restaurant['name'])) {
                    $rname = $restaurant['name'];
                }
            }
            
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
        // Charger les plats depuis menu_items.json pour récupérer les noms
        $menuItemsPath = storage_path('app/private/menu_items.json');
        $menuItems = [];
        if (file_exists($menuItemsPath)) {
            $menuItems = json_decode(file_get_contents($menuItemsPath), true) ?? [];
            // Indexer par item_id pour accès rapide
            $menuItemsById = [];
            foreach ($menuItems as $menuItem) {
                $menuItemsById[$menuItem['id']] = $menuItem;
            }
        }
        
        $dishes = [];
        
        foreach ($orders as $order) {
            foreach ($order['items'] ?? [] as $item) {
                // Priorité 1: Nom depuis l'item (nouvelles commandes)
                $name = $item['name'] ?? null;
                
                // Priorité 2: Chercher dans menu_items.json via item_id (anciennes commandes)
                if (!$name && isset($item['item_id']) && isset($menuItemsById[$item['item_id']])) {
                    $name = $menuItemsById[$item['item_id']]['name'] ?? null;
                }
                
                // Fallback: Plat inconnu
                if (!$name) {
                    $name = 'Plat inconnu';
                }
                
                $quantity = $item['quantity'] ?? 0;
                $price = $item['price'] ?? 0;
                
                // Initialiser le plat s'il n'existe pas encore
                if (!isset($dishes[$name])) {
                    $dishes[$name] = [
                        'name' => $name,
                        'quantity' => 0,
                        'revenue' => 0,
                        'orders_count' => 0
                    ];
                }
                
                // Incrémenter les statistiques
                $dishes[$name]['quantity'] += $quantity;
                $dishes[$name]['revenue'] += $price * $quantity;
                $dishes[$name]['orders_count'] += 1; // Nombre de commandes contenant ce plat
            }
        }
        
        // Trier par quantité décroissante
        usort($dishes, fn($a, $b) => $b['quantity'] - $a['quantity']);
        
        // Limiter aux 10 premiers
        return array_slice(array_values($dishes), 0, 10);
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
