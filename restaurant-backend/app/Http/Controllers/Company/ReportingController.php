<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\DirectPayment;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReportingController extends Controller
{
    private $ordersFile = 'orders.json';
    private $employeesFile = 'employees.json';
    private $restaurantsFile = 'restaurants.json';

    /**
     * Obtenir les statistiques de dépenses par restaurant
     */
    public function getRestaurantExpenses(Request $request)
    {
        try {
            $companyId = $request->header('X-User-Company-Id');
            $role = $request->header('X-User-Role');

            if (!$companyId) {
                return response()->json(['error' => 'Company ID manquant'], 401);
            }

            // Valider les filtres
            $validated = $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'restaurant_id' => 'nullable|string'
            ]);

            // Charger les données
            $orders = $this->loadOrders();
            $directPayments = $this->loadDirectPayments();
            $employees = $this->loadEmployees();
            $restaurants = $this->loadRestaurants();

            // Filtrer les employés de l'entreprise
            $companyEmployeeIds = collect($employees)
                ->where('company_id', $companyId)
                ->pluck('id')
                ->toArray();

            // Filtrer les commandes validées des employés de l'entreprise
            $filteredOrders = collect($orders)->filter(function ($order) use ($companyEmployeeIds, $validated) {
                if ($order['status'] !== 'confirmed') return false;
                if (!in_array($order['employee_id'], $companyEmployeeIds)) return false;

                if (!empty($validated['start_date'])) {
                    $orderDate = date('Y-m-d', strtotime($order['created_at']));
                    if ($orderDate < $validated['start_date']) return false;
                }
                if (!empty($validated['end_date'])) {
                    $orderDate = date('Y-m-d', strtotime($order['created_at']));
                    if ($orderDate > $validated['end_date']) return false;
                }
                if (!empty($validated['restaurant_id'])) {
                    if ($order['restaurant_id'] !== $validated['restaurant_id']) return false;
                }

                return true;
            })->values();

            // Filtrer les paiements directs (consommations)
            $filteredDirectPayments = collect($directPayments)->filter(function ($dp) use ($companyEmployeeIds, $validated) {
                if (($dp['status'] ?? null) !== 'completed') return false;
                if (!in_array((string)($dp['employee_id'] ?? ''), array_map('strval', $companyEmployeeIds))) return false;

                if (!empty($validated['start_date'])) {
                    $d = date('Y-m-d', strtotime($dp['created_at']));
                    if ($d < $validated['start_date']) return false;
                }
                if (!empty($validated['end_date'])) {
                    $d = date('Y-m-d', strtotime($dp['created_at']));
                    if ($d > $validated['end_date']) return false;
                }
                if (!empty($validated['restaurant_id'])) {
                    if ((string)$dp['restaurant_id'] !== (string)$validated['restaurant_id']) return false;
                }

                return true;
            })->map(function ($dp) {
                return [
                    'id' => $dp['id'] ?? null,
                    'restaurant_id' => $dp['restaurant_id'] ?? null,
                    'employee_id' => $dp['employee_id'] ?? null,
                    'employee_name' => $dp['employee_name'] ?? null,
                    'total_amount' => (float)($dp['ticket_amount_used'] ?? $dp['amount'] ?? 0),
                    'created_at' => $dp['created_at'] ?? null,
                    '_type' => 'direct_payment',
                ];
            })->values();

            $allConsumptions = $filteredOrders->map(function ($o) {
                $o['_type'] = 'order';
                return $o;
            })->values()->merge($filteredDirectPayments)->values();

            // Grouper par restaurant avec détails employés
            $expensesByRestaurant = [];

            foreach ($allConsumptions as $order) {
                $restaurantId = $order['restaurant_id'];

                if (!isset($expensesByRestaurant[$restaurantId])) {
                    $restaurant = collect($restaurants)->firstWhere('id', $restaurantId);
                    $expensesByRestaurant[$restaurantId] = [
                        'restaurant_id' => $restaurantId,
                        'restaurant_name' => $restaurant['name'] ?? 'Restaurant Inconnu',
                        'total_amount' => 0,
                        'total_orders' => 0,
                        'employees_count' => 0,
                        'employee_ids' => [],
                        'employee_breakdown' => [],
                    ];
                }

                $expensesByRestaurant[$restaurantId]['total_amount'] += (float) $order['total_amount'];
                $expensesByRestaurant[$restaurantId]['total_orders']++;

                // Compter les employés uniques
                if (!in_array($order['employee_id'], $expensesByRestaurant[$restaurantId]['employee_ids'])) {
                    $expensesByRestaurant[$restaurantId]['employee_ids'][] = $order['employee_id'];
                    $expensesByRestaurant[$restaurantId]['employees_count']++;
                }

                // Breakdown par employé
                $empId = $order['employee_id'];
                if (!isset($expensesByRestaurant[$restaurantId]['employee_breakdown'][$empId])) {
                    $emp = collect($employees)->firstWhere('id', $empId);
                    $expensesByRestaurant[$restaurantId]['employee_breakdown'][$empId] = [
                        'employee_id' => $empId,
                        'employee_name' => $emp['name'] ?? 'Inconnu',
                        'total_amount' => 0,
                        'total_orders' => 0,
                    ];
                }
                $expensesByRestaurant[$restaurantId]['employee_breakdown'][$empId]['total_amount'] += (float) $order['total_amount'];
                $expensesByRestaurant[$restaurantId]['employee_breakdown'][$empId]['total_orders']++;
            }

            // Nettoyer et trier
            $results = array_values($expensesByRestaurant);
            usort($results, function ($a, $b) {
                return $b['total_amount'] - $a['total_amount'];
            });

            // Convertir employee_breakdown en array indexé et supprimer employee_ids
            foreach ($results as &$result) {
                $breakdown = array_values($result['employee_breakdown']);
                usort($breakdown, fn($a, $b) => $b['total_amount'] - $a['total_amount']);
                $result['employee_breakdown'] = $breakdown;
                unset($result['employee_ids']);
            }

            // Calculer les totaux globaux
            $totalAmount = array_sum(array_column($results, 'total_amount'));
            $totalOrders = array_sum(array_column($results, 'total_orders'));
            $allEmployeeIds = [];
            foreach ($results as $r) {
                foreach ($r['employee_breakdown'] as $eb) {
                    $allEmployeeIds[$eb['employee_id']] = true;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'expenses_by_restaurant' => $results,
                    'summary' => [
                        'total_amount' => $totalAmount,
                        'total_orders' => $totalOrders,
                        'restaurants_count' => count($results),
                        'employees_count' => count($allEmployeeIds),
                        'average_per_order' => $totalOrders > 0 ? round($totalAmount / $totalOrders) : 0,
                        'average_per_employee' => count($allEmployeeIds) > 0 ? round($totalAmount / count($allEmployeeIds)) : 0,
                        'period' => [
                            'start_date' => $validated['start_date'] ?? null,
                            'end_date' => $validated['end_date'] ?? null
                        ]
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Obtenir les statistiques détaillées par employé
     */
    public function getEmployeeExpenses(Request $request)
    {
        try {
            $companyId = $request->header('X-User-Company-Id');

            if (!$companyId) {
                return response()->json(['error' => 'Company ID manquant'], 401);
            }

            $validated = $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'restaurant_id' => 'nullable|string'
            ]);

            $orders = $this->loadOrders();
            $directPayments = $this->loadDirectPayments();
            $employees = $this->loadEmployees();
            $restaurants = $this->loadRestaurants();

            $companyEmployees = collect($employees)->where('company_id', $companyId);

            $expensesByEmployee = [];
            $globalTotalAmount = 0;
            $globalTotalOrders = 0;

            foreach ($companyEmployees as $employee) {
                $employeeOrders = collect($orders)->filter(function ($order) use ($employee, $validated) {
                    if ($order['employee_id'] !== $employee['id']) return false;
                    if ($order['status'] !== 'confirmed') return false;

                    if (!empty($validated['start_date'])) {
                        $orderDate = date('Y-m-d', strtotime($order['created_at']));
                        if ($orderDate < $validated['start_date']) return false;
                    }
                    if (!empty($validated['end_date'])) {
                        $orderDate = date('Y-m-d', strtotime($order['created_at']));
                        if ($orderDate > $validated['end_date']) return false;
                    }
                    if (!empty($validated['restaurant_id'])) {
                        if ($order['restaurant_id'] !== $validated['restaurant_id']) return false;
                    }
                    return true;
                });

                $employeeDirectPayments = collect($directPayments)->filter(function ($dp) use ($employee, $validated) {
                    if ((string)($dp['employee_id'] ?? '') !== (string)$employee['id']) return false;
                    if (($dp['status'] ?? null) !== 'completed') return false;

                    if (!empty($validated['start_date'])) {
                        $d = date('Y-m-d', strtotime($dp['created_at']));
                        if ($d < $validated['start_date']) return false;
                    }
                    if (!empty($validated['end_date'])) {
                        $d = date('Y-m-d', strtotime($dp['created_at']));
                        if ($d > $validated['end_date']) return false;
                    }
                    if (!empty($validated['restaurant_id'])) {
                        if ((string)$dp['restaurant_id'] !== (string)$validated['restaurant_id']) return false;
                    }

                    return true;
                })->values();

                if ($employeeOrders->count() > 0 || $employeeDirectPayments->count() > 0) {
                    $totalAmount = (float)$employeeOrders->sum('total_amount')
                        + (float)$employeeDirectPayments->sum(fn($dp) => (float)($dp['ticket_amount_used'] ?? $dp['amount'] ?? 0));
                    $totalOrders = $employeeOrders->count() + $employeeDirectPayments->count();
                    $globalTotalAmount += $totalAmount;
                    $globalTotalOrders += $totalOrders;

                    // Dernière commande
                    $lastOrder = collect([])
                        ->merge($employeeOrders->map(fn($o) => ['created_at' => $o['created_at'] ?? null, '_type' => 'order']))
                        ->merge($employeeDirectPayments->map(fn($dp) => ['created_at' => $dp['created_at'] ?? null, '_type' => 'direct_payment']))
                        ->sortByDesc('created_at')
                        ->first();

                    // Breakdown par restaurant
                    $restaurantBreakdown = [];
                    $allEmpConsumptions = collect([])
                        ->merge($employeeOrders->map(fn($o) => [
                            'restaurant_id' => $o['restaurant_id'],
                            'total_amount' => (float)($o['total_amount'] ?? 0),
                            'created_at' => $o['created_at'] ?? null,
                            'id' => $o['id'] ?? null,
                            'items' => $o['items'] ?? null,
                            '_type' => 'order',
                        ]))
                        ->merge($employeeDirectPayments->map(fn($dp) => [
                            'restaurant_id' => $dp['restaurant_id'],
                            'total_amount' => (float)($dp['ticket_amount_used'] ?? $dp['amount'] ?? 0),
                            'created_at' => $dp['created_at'] ?? null,
                            'id' => $dp['id'] ?? null,
                            'items' => [],
                            '_type' => 'direct_payment',
                        ]));

                    foreach ($allEmpConsumptions->groupBy('restaurant_id') as $restId => $restOrders) {
                        $restaurant = collect($restaurants)->firstWhere('id', $restId);
                        $restaurantBreakdown[] = [
                            'restaurant_id' => $restId,
                            'restaurant_name' => $restaurant['name'] ?? 'Inconnu',
                            'total_amount' => $restOrders->sum('total_amount'),
                            'total_orders' => $restOrders->count(),
                        ];
                    }
                    usort($restaurantBreakdown, fn($a, $b) => $b['total_amount'] - $a['total_amount']);

                    // Historique des commandes récentes (5 dernières)
                    $recentOrders = $allEmpConsumptions->sortByDesc('created_at')->take(5)->map(function ($order) use ($restaurants) {
                        $restaurant = collect($restaurants)->firstWhere('id', $order['restaurant_id']);
                        return [
                            'id' => $order['id'],
                            'restaurant_name' => $restaurant['name'] ?? 'Inconnu',
                            'total_amount' => $order['total_amount'],
                            'items_count' => is_array($order['items'] ?? null) ? count($order['items']) : 0,
                            'created_at' => $order['created_at'],
                        ];
                    })->values()->toArray();

                    $expensesByEmployee[] = [
                        'employee_id' => $employee['id'],
                        'employee_name' => $employee['name'],
                        'employee_email' => $employee['email'],
                        'total_amount' => $totalAmount,
                        'total_orders' => $totalOrders,
                        'average_order' => $totalOrders > 0 ? round($totalAmount / $totalOrders) : 0,
                        'last_order_date' => $lastOrder['created_at'] ?? null,
                        'restaurants_count' => count($restaurantBreakdown),
                        'restaurant_breakdown' => $restaurantBreakdown,
                        'recent_orders' => $recentOrders,
                    ];
                }
            }

            usort($expensesByEmployee, function ($a, $b) {
                return $b['total_amount'] - $a['total_amount'];
            });

            // Résumé global
            $employeesWithOrders = count($expensesByEmployee);
            $allRestaurantIds = [];
            foreach ($expensesByEmployee as $emp) {
                foreach ($emp['restaurant_breakdown'] as $rb) {
                    $allRestaurantIds[$rb['restaurant_id']] = true;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'expenses_by_employee' => $expensesByEmployee,
                    'summary' => [
                        'total_amount' => $globalTotalAmount,
                        'total_orders' => $globalTotalOrders,
                        'employees_count' => $employeesWithOrders,
                        'restaurants_count' => count($allRestaurantIds),
                        'average_per_order' => $globalTotalOrders > 0 ? round($globalTotalAmount / $globalTotalOrders) : 0,
                        'average_per_employee' => $employeesWithOrders > 0 ? round($globalTotalAmount / $employeesWithOrders) : 0,
                        'period' => [
                            'start_date' => $validated['start_date'] ?? null,
                            'end_date' => $validated['end_date'] ?? null
                        ]
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des dépenses par employé: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Charger les commandes
     */
    private function loadOrders()
    {
        return \App\Models\Order::all()->toArray();
    }

    private function loadDirectPayments()
    {
        return DirectPayment::all()->toArray();
    }

    /**
     * Charger les employés
     */
    private function loadEmployees()
    {
        return \App\Models\Employee::all()->toArray();
    }

    /**
     * Charger les restaurants depuis la base de données
     */
    private function loadRestaurants()
    {
        try {
            return Restaurant::all()->map(function ($restaurant) {
                return [
                    'id' => (string) $restaurant->id,
                    'name' => $restaurant->name,
                    'address' => $restaurant->address,
                    'phone' => $restaurant->phone,
                    'status' => $restaurant->status,
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::error('Erreur lors du chargement des restaurants: ' . $e->getMessage());
            return [];
        }
    }
}
