<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
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
            $employees = $this->loadEmployees();
            $restaurants = $this->loadRestaurants();

            // Filtrer les employés de l'entreprise
            $companyEmployeeIds = collect($employees)
                ->where('company_id', $companyId)
                ->pluck('id')
                ->toArray();

            // Filtrer les commandes validées des employés de l'entreprise
            $filteredOrders = collect($orders)->filter(function ($order) use ($companyEmployeeIds, $validated) {
                // Doit être validée
                if ($order['status'] !== 'confirmed') {
                    return false;
                }

                // Doit être d'un employé de l'entreprise
                if (!in_array($order['employee_id'], $companyEmployeeIds)) {
                    return false;
                }

                // Filtre par date de début
                if (!empty($validated['start_date'])) {
                    $orderDate = date('Y-m-d', strtotime($order['created_at']));
                    if ($orderDate < $validated['start_date']) {
                        return false;
                    }
                }

                // Filtre par date de fin
                if (!empty($validated['end_date'])) {
                    $orderDate = date('Y-m-d', strtotime($order['created_at']));
                    if ($orderDate > $validated['end_date']) {
                        return false;
                    }
                }

                // Filtre par restaurant
                if (!empty($validated['restaurant_id'])) {
                    if ($order['restaurant_id'] !== $validated['restaurant_id']) {
                        return false;
                    }
                }

                return true;
            });

            // Grouper par restaurant
            $expensesByRestaurant = [];

            foreach ($filteredOrders as $order) {
                $restaurantId = $order['restaurant_id'];
                
                if (!isset($expensesByRestaurant[$restaurantId])) {
                    $restaurant = collect($restaurants)->firstWhere('id', $restaurantId);
                    $expensesByRestaurant[$restaurantId] = [
                        'restaurant_id' => $restaurantId,
                        'restaurant_name' => $restaurant['name'] ?? 'Restaurant Inconnu',
                        'total_amount' => 0,
                        'total_orders' => 0,
                        'employees_count' => 0,
                        'employee_ids' => []
                    ];
                }

                $expensesByRestaurant[$restaurantId]['total_amount'] += $order['total_amount'];
                $expensesByRestaurant[$restaurantId]['total_orders']++;
                
                // Compter les employés uniques
                if (!in_array($order['employee_id'], $expensesByRestaurant[$restaurantId]['employee_ids'])) {
                    $expensesByRestaurant[$restaurantId]['employee_ids'][] = $order['employee_id'];
                    $expensesByRestaurant[$restaurantId]['employees_count']++;
                }
            }

            // Nettoyer et trier
            $results = array_values($expensesByRestaurant);
            usort($results, function ($a, $b) {
                return $b['total_amount'] - $a['total_amount'];
            });

            // Supprimer employee_ids avant retour
            foreach ($results as &$result) {
                unset($result['employee_ids']);
            }

            // Calculer les totaux globaux
            $totalAmount = array_sum(array_column($results, 'total_amount'));
            $totalOrders = array_sum(array_column($results, 'total_orders'));

            return response()->json([
                'success' => true,
                'data' => [
                    'expenses_by_restaurant' => $results,
                    'summary' => [
                        'total_amount' => $totalAmount,
                        'total_orders' => $totalOrders,
                        'restaurants_count' => count($results),
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
            $employees = $this->loadEmployees();

            $companyEmployees = collect($employees)->where('company_id', $companyId);

            $expensesByEmployee = [];

            foreach ($companyEmployees as $employee) {
                $employeeOrders = collect($orders)->filter(function ($order) use ($employee, $validated) {
                    if ($order['employee_id'] !== $employee['id']) {
                        return false;
                    }

                    if ($order['status'] !== 'confirmed') {
                        return false;
                    }

                    if (!empty($validated['start_date'])) {
                        $orderDate = date('Y-m-d', strtotime($order['created_at']));
                        if ($orderDate < $validated['start_date']) {
                            return false;
                        }
                    }

                    if (!empty($validated['end_date'])) {
                        $orderDate = date('Y-m-d', strtotime($order['created_at']));
                        if ($orderDate > $validated['end_date']) {
                            return false;
                        }
                    }

                    if (!empty($validated['restaurant_id'])) {
                        if ($order['restaurant_id'] !== $validated['restaurant_id']) {
                            return false;
                        }
                    }

                    return true;
                });

                if ($employeeOrders->count() > 0) {
                    $expensesByEmployee[] = [
                        'employee_id' => $employee['id'],
                        'employee_name' => $employee['name'],
                        'employee_email' => $employee['email'],
                        'total_amount' => $employeeOrders->sum('total_amount'),
                        'total_orders' => $employeeOrders->count()
                    ];
                }
            }

            usort($expensesByEmployee, function ($a, $b) {
                return $b['total_amount'] - $a['total_amount'];
            });

            return response()->json([
                'success' => true,
                'data' => $expensesByEmployee
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
        $filePath = storage_path('app/' . $this->ordersFile);
        
        if (!file_exists($filePath)) {
            return [];
        }

        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }

    /**
     * Charger les employés
     */
    private function loadEmployees()
    {
        $filePath = storage_path('app/' . $this->employeesFile);
        
        if (!file_exists($filePath)) {
            return [];
        }

        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
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
