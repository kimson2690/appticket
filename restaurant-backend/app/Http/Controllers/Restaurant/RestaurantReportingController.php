<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RestaurantReportingController extends Controller
{
    private $ordersFile = 'orders.json';
    private $employeesFile = 'employees.json';
    private $companiesFile = 'companies.json';

    /**
     * Obtenir les statistiques de commandes par entreprise
     */
    public function getCompanyOrders(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');
            $role = $request->header('X-User-Role');

            if (!$restaurantId) {
                return response()->json(['error' => 'Restaurant ID manquant'], 401);
            }

            // Valider les filtres
            $validated = $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'company_id' => 'nullable|string'
            ]);

            // Charger les données
            $orders = $this->loadOrders();
            $employees = $this->loadEmployees();
            $companies = $this->loadCompanies();

            // Filtrer les commandes du restaurant
            $filteredOrders = collect($orders)->filter(function ($order) use ($restaurantId, $validated, $employees) {
                // Doit être du restaurant concerné
                if ($order['restaurant_id'] !== $restaurantId) {
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

                // Filtre par entreprise
                if (!empty($validated['company_id'])) {
                    $employee = collect($employees)->firstWhere('id', $order['employee_id']);
                    // Comparaison souple pour gérer string vs int
                    if (!$employee || (string)$employee['company_id'] !== (string)$validated['company_id']) {
                        return false;
                    }
                }

                return true;
            });

            // Créer un map employee_id -> company_id
            $employeeCompanyMap = [];
            foreach ($employees as $employee) {
                $employeeCompanyMap[$employee['id']] = $employee['company_id'];
            }

            // Grouper par entreprise
            $ordersByCompany = [];

            foreach ($filteredOrders as $order) {
                $employeeId = $order['employee_id'];
                $companyId = $employeeCompanyMap[$employeeId] ?? null;

                if (!$companyId) {
                    continue;
                }

                if (!isset($ordersByCompany[$companyId])) {
                    $company = collect($companies)->firstWhere('id', $companyId);
                    $ordersByCompany[$companyId] = [
                        'company_id' => $companyId,
                        'company_name' => $company['name'] ?? 'Entreprise Inconnue',
                        'total_amount' => 0,
                        'total_orders' => 0,
                        'confirmed_orders' => 0,
                        'pending_orders' => 0,
                        'rejected_orders' => 0,
                        'employees_count' => 0,
                        'employee_ids' => []
                    ];
                }

                $ordersByCompany[$companyId]['total_orders']++;
                
                // Compter par statut
                if ($order['status'] === 'confirmed') {
                    $ordersByCompany[$companyId]['confirmed_orders']++;
                    $ordersByCompany[$companyId]['total_amount'] += $order['total_amount'];
                } elseif ($order['status'] === 'pending') {
                    $ordersByCompany[$companyId]['pending_orders']++;
                } elseif ($order['status'] === 'rejected') {
                    $ordersByCompany[$companyId]['rejected_orders']++;
                }

                // Compter les employés uniques
                if (!in_array($employeeId, $ordersByCompany[$companyId]['employee_ids'])) {
                    $ordersByCompany[$companyId]['employee_ids'][] = $employeeId;
                    $ordersByCompany[$companyId]['employees_count']++;
                }
            }

            // Nettoyer et trier
            $results = array_values($ordersByCompany);
            
            // Si un filtre company_id est appliqué, ne retourner que cette entreprise
            if (!empty($validated['company_id'])) {
                $results = array_filter($results, function($result) use ($validated) {
                    // Comparaison souple pour gérer string vs int
                    return (string)$result['company_id'] === (string)$validated['company_id'];
                });
                $results = array_values($results); // Réindexer le tableau
                
                // Si l'entreprise n'a aucune commande, créer une entrée vide
                if (empty($results)) {
                    $company = collect($companies)->firstWhere('id', $validated['company_id']);
                    if ($company) {
                        $results = [[
                            'company_id' => $validated['company_id'],
                            'company_name' => $company['name'],
                            'total_amount' => 0,
                            'total_orders' => 0,
                            'confirmed_orders' => 0,
                            'pending_orders' => 0,
                            'rejected_orders' => 0,
                            'employees_count' => 0
                        ]];
                    }
                }
            }
            
            usort($results, function ($a, $b) {
                return $b['total_orders'] - $a['total_orders'];
            });

            // Supprimer employee_ids avant retour
            foreach ($results as &$result) {
                unset($result['employee_ids']);
            }

            // Calculer les totaux globaux
            $totalOrders = array_sum(array_column($results, 'total_orders'));
            $totalConfirmed = array_sum(array_column($results, 'confirmed_orders'));
            $totalPending = array_sum(array_column($results, 'pending_orders'));
            $totalRejected = array_sum(array_column($results, 'rejected_orders'));
            $totalAmount = array_sum(array_column($results, 'total_amount'));

            return response()->json([
                'success' => true,
                'data' => [
                    'orders_by_company' => $results,
                    'summary' => [
                        'total_orders' => $totalOrders,
                        'confirmed_orders' => $totalConfirmed,
                        'pending_orders' => $totalPending,
                        'rejected_orders' => $totalRejected,
                        'total_amount' => $totalAmount,
                        'companies_count' => count($results),
                        'period' => [
                            'start_date' => $validated['start_date'] ?? null,
                            'end_date' => $validated['end_date'] ?? null
                        ]
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques restaurant: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtenir les statistiques détaillées par employé
     */
    public function getEmployeeOrders(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');

            if (!$restaurantId) {
                return response()->json(['error' => 'Restaurant ID manquant'], 401);
            }

            $validated = $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date',
                'company_id' => 'nullable|string'
            ]);

            $orders = $this->loadOrders();
            $employees = $this->loadEmployees();

            // Filtrer les commandes du restaurant
            $restaurantOrders = collect($orders)->filter(function ($order) use ($restaurantId, $validated) {
                if ($order['restaurant_id'] !== $restaurantId) {
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

                return true;
            });

            $ordersByEmployee = [];

            foreach ($restaurantOrders as $order) {
                $employeeId = $order['employee_id'];
                $employee = collect($employees)->firstWhere('id', $employeeId);

                if (!$employee) {
                    continue;
                }

                // Filtre par entreprise si spécifié
                if (!empty($validated['company_id']) && $employee['company_id'] !== $validated['company_id']) {
                    continue;
                }

                if (!isset($ordersByEmployee[$employeeId])) {
                    $ordersByEmployee[$employeeId] = [
                        'employee_id' => $employeeId,
                        'employee_name' => $employee['name'],
                        'employee_email' => $employee['email'],
                        'company_id' => $employee['company_id'],
                        'total_orders' => 0,
                        'confirmed_orders' => 0,
                        'pending_orders' => 0,
                        'rejected_orders' => 0,
                        'total_amount' => 0
                    ];
                }

                $ordersByEmployee[$employeeId]['total_orders']++;

                if ($order['status'] === 'confirmed') {
                    $ordersByEmployee[$employeeId]['confirmed_orders']++;
                    $ordersByEmployee[$employeeId]['total_amount'] += $order['total_amount'];
                } elseif ($order['status'] === 'pending') {
                    $ordersByEmployee[$employeeId]['pending_orders']++;
                } elseif ($order['status'] === 'rejected') {
                    $ordersByEmployee[$employeeId]['rejected_orders']++;
                }
            }

            $results = array_values($ordersByEmployee);
            usort($results, function ($a, $b) {
                return $b['total_orders'] - $a['total_orders'];
            });

            return response()->json([
                'success' => true,
                'data' => $results
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des commandes par employé: ' . $e->getMessage());
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
     * Charger les entreprises depuis la base de données
     */
    private function loadCompanies()
    {
        try {
            return Company::all()->map(function ($company) {
                return [
                    'id' => (string) $company->id,
                    'name' => $company->name,
                    'email' => $company->email,
                    'phone' => $company->phone,
                    'status' => $company->status,
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::error('Erreur lors du chargement des entreprises: ' . $e->getMessage());
            return [];
        }
    }
}
