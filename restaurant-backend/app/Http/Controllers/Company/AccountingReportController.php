<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Services\ExcelReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AccountingReportController extends Controller
{
    /**
     * Obtient les données du rapport comptable mensuel
     */
    public function getAccountingReport(Request $request)
    {
        try {
            $validated = $request->validate([
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2020|max:2100'
            ]);

            $companyId = $request->header('X-User-Company-Id');
            $userRole = $request->header('X-User-Role');

            if ($userRole !== 'Administrateur' && $userRole !== 'Gestionnaire Entreprise') {
                return response()->json([
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ], 403);
            }

            // Si gestionnaire, filtrer par entreprise
            if ($userRole === 'Gestionnaire Entreprise' && !$companyId) {
                return response()->json([
                    'success' => false,
                    'error' => 'ID entreprise manquant'
                ], 400);
            }

            $month = $validated['month'];
            $year = $validated['year'];

            // Charger les données
            $companies = $this->loadCompanies();
            $users = $this->loadUsers();
            $ticketBatches = $this->loadTicketBatches();
            $orders = $this->loadOrders();

            // Filtrer par entreprise si nécessaire
            if ($userRole === 'Gestionnaire Entreprise') {
                $users = array_filter($users, fn($u) => (string)$u['company_id'] === (string)$companyId);
                $ticketBatches = array_filter($ticketBatches, fn($b) => (string)$b['company_id'] === (string)$companyId);
                $companies = array_filter($companies, fn($c) => (string)$c['id'] === (string)$companyId);
            }

            // Obtenir le nom de l'entreprise
            $company = collect($companies)->first();
            $companyName = $company['name'] ?? 'Entreprise';

            // Calculer les données du rapport
            $data = $this->calculateReportData($users, $ticketBatches, $orders, $month, $year, $companyName);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur rapport comptable: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporte le rapport en Excel
     */
    public function exportAccountingReport(Request $request)
    {
        try {
            $validated = $request->validate([
                'month' => 'required|integer|min:1|max:12',
                'year' => 'required|integer|min:2020|max:2100'
            ]);

            $companyId = $request->header('X-User-Company-Id');
            $userRole = $request->header('X-User-Role');

            if ($userRole !== 'Administrateur' && $userRole !== 'Gestionnaire Entreprise') {
                return response()->json([
                    'success' => false,
                    'error' => 'Accès non autorisé'
                ], 403);
            }

            if ($userRole === 'Gestionnaire Entreprise' && !$companyId) {
                return response()->json([
                    'success' => false,
                    'error' => 'ID entreprise manquant'
                ], 400);
            }

            $month = $validated['month'];
            $year = $validated['year'];

            // Charger les données
            $companies = $this->loadCompanies();
            $users = $this->loadUsers();
            $ticketBatches = $this->loadTicketBatches();
            $orders = $this->loadOrders();

            // Filtrer par entreprise
            if ($userRole === 'Gestionnaire Entreprise') {
                $users = array_filter($users, fn($u) => (string)$u['company_id'] === (string)$companyId);
                $ticketBatches = array_filter($ticketBatches, fn($b) => (string)$b['company_id'] === (string)$companyId);
                $companies = array_filter($companies, fn($c) => (string)$c['id'] === (string)$companyId);
            }

            $company = collect($companies)->first();
            $companyName = $company['name'] ?? 'Entreprise';

            // Calculer les données
            $data = $this->calculateReportData($users, $ticketBatches, $orders, $month, $year, $companyName);

            // Générer le fichier Excel
            $excelService = new ExcelReportService();
            $spreadsheet = $excelService->generateAccountingReport($data, $companyName, $month, $year);

            // Nom du fichier
            $monthName = $this->getMonthName($month);
            $filename = 'Rapport_Comptable_' . str_replace(' ', '_', $companyName) . '_' . $monthName . '_' . $year . '.xlsx';

            // Sauvegarder temporairement
            $filepath = $excelService->save($filename);

            // Retourner le fichier avec headers CORS
            return response()->download($filepath, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, X-User-Role, X-User-Company-Id'
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            Log::error('Erreur export Excel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calcule toutes les données du rapport
     */
    private function calculateReportData($users, $ticketBatches, $orders, $month, $year, $companyName)
    {
        // Convertir en collections
        $users = collect($users);
        $ticketBatches = collect($ticketBatches);
        $orders = collect($orders);

        // Début et fin du mois
        $startDate = Carbon::create($year, $month, 1)->startOfDay();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->endOfDay();

        // Filtrer les données du mois
        $monthBatches = $ticketBatches->filter(function($batch) use ($startDate, $endDate) {
            $createdAt = Carbon::parse($batch['created_at']);
            return $createdAt->between($startDate, $endDate);
        });

        $monthOrders = $orders->filter(function($order) use ($startDate, $endDate) {
            $createdAt = Carbon::parse($order['created_at']);
            return $createdAt->between($startDate, $endDate) && $order['status'] === 'confirmed';
        });

        // Calculer les totaux
        $ticketsAssignedCount = $monthBatches->sum('total_tickets');
        $ticketsAssignedAmount = $monthBatches->sum(function($batch) {
            return $batch['total_tickets'] * $batch['ticket_value'];
        });

        // Calculer les tickets utilisés (estimation : 1 ticket par commande minimum)
        $ticketsUsedCount = $monthOrders->count(); // Nombre de commandes comme proxy
        $ticketsUsedAmount = $monthOrders->sum('ticket_amount_used');

        $ticketsRemainingCount = $ticketsAssignedCount - $ticketsUsedCount;
        $ticketsRemainingAmount = $ticketsAssignedAmount - $ticketsUsedAmount;

        $usageRate = $ticketsAssignedCount > 0 ? ($ticketsUsedCount / $ticketsAssignedCount) * 100 : 0;

        // Statistiques
        $activeEmployees = $users->where('status', 'active')->count();
        $restaurantsCount = $monthOrders->pluck('restaurant_id')->unique()->count();
        $ordersCount = $monthOrders->count();
        $averageOrderAmount = $ordersCount > 0 ? $ticketsUsedAmount / $ordersCount : 0;

        // Données par employé
        $byEmployee = $this->getDataByEmployee($users, $monthBatches, $monthOrders);

        // Données par restaurant
        $byRestaurant = $this->getDataByRestaurant($monthOrders);

        // Données par date
        $byDate = $this->getDataByDate($monthBatches, $monthOrders);

        // Réconciliation
        $reconciliation = $this->getReconciliation($monthBatches, $monthOrders, $startDate, $endDate);

        return [
            'summary' => [
                'tickets_assigned_count' => $ticketsAssignedCount,
                'tickets_assigned_amount' => $ticketsAssignedAmount,
                'tickets_used_count' => $ticketsUsedCount,
                'tickets_used_amount' => $ticketsUsedAmount,
                'tickets_remaining_count' => $ticketsRemainingCount,
                'tickets_remaining_amount' => $ticketsRemainingAmount,
                'usage_rate' => round($usageRate, 2),
                'active_employees' => $activeEmployees,
                'restaurants_count' => $restaurantsCount,
                'orders_count' => $ordersCount,
                'average_order_amount' => round($averageOrderAmount, 0)
            ],
            'by_employee' => $byEmployee,
            'by_restaurant' => $byRestaurant,
            'by_date' => $byDate,
            'reconciliation' => $reconciliation
        ];
    }

    /**
     * Données par employé
     */
    private function getDataByEmployee($users, $batches, $orders)
    {
        $result = [];
        
        foreach ($users as $user) {
            if ($user['status'] !== 'active') continue;

            $userId = (string)$user['id'];

            // Tickets affectés
            $userBatches = $batches->filter(fn($b) => (string)$b['employee_id'] === $userId);
            $ticketsAssigned = $userBatches->sum('total_tickets');
            $amountAssigned = $userBatches->sum(fn($b) => $b['total_tickets'] * $b['ticket_value']);

            // Tickets consommés
            $userOrders = $orders->filter(fn($o) => (string)$o['employee_id'] === $userId);
            $ticketsUsed = $userOrders->count(); // Nombre de commandes
            $amountUsed = $userOrders->sum('ticket_amount_used');

            // Calculs
            $ticketsRemaining = $ticketsAssigned - $ticketsUsed;
            $balance = $amountAssigned - $amountUsed;
            $usageRate = $ticketsAssigned > 0 ? ($ticketsUsed / $ticketsAssigned) * 100 : 0;

            $result[] = [
                'employee_id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'department' => $user['department'] ?? 'N/A',
                'tickets_assigned' => $ticketsAssigned,
                'tickets_used' => $ticketsUsed,
                'tickets_remaining' => $ticketsRemaining,
                'amount_assigned' => $amountAssigned,
                'amount_used' => $amountUsed,
                'balance' => $balance,
                'usage_rate' => round($usageRate, 2)
            ];
        }

        return $result;
    }

    /**
     * Données par restaurant
     */
    private function getDataByRestaurant($orders)
    {
        $restaurants = $this->loadRestaurants();
        $result = [];

        $totalAmount = $orders->sum('ticket_amount_used');

        $grouped = $orders->groupBy('restaurant_id');

        foreach ($grouped as $restaurantId => $restaurantOrders) {
            // Extraire le nom du restaurant depuis les items
            // Parcourir TOUTES les commandes pour trouver un nom
            $restaurantName = null;
            foreach ($restaurantOrders as $order) {
                if (isset($order['items']) && count($order['items']) > 0) {
                    foreach ($order['items'] as $item) {
                        if (isset($item['restaurant_name'])) {
                            $restaurantName = $item['restaurant_name'];
                            break 2; // Sortir des deux boucles
                        }
                    }
                }
            }
            
            // Si pas trouvé, utiliser un nom par défaut
            if (!$restaurantName) {
                $restaurantName = 'Restaurant #' . $restaurantId;
            }
            
            $ordersCount = $restaurantOrders->count();
            $amount = $restaurantOrders->sum('ticket_amount_used');
            $average = $ordersCount > 0 ? $amount / $ordersCount : 0;
            $percentage = $totalAmount > 0 ? ($amount / $totalAmount) * 100 : 0;

            $result[] = [
                'name' => $restaurantName,
                'address' => 'N/A', // Pas disponible dans les items
                'phone' => 'N/A',   // Pas disponible dans les items
                'orders_count' => $ordersCount,
                'total_amount' => $amount,
                'average_order' => round($average, 0),
                'percentage' => round($percentage, 2)
            ];
        }

        // Trier par montant décroissant
        usort($result, fn($a, $b) => $b['total_amount'] <=> $a['total_amount']);

        return $result;
    }

    /**
     * Données par date (chronologique)
     */
    private function getDataByDate($batches, $orders)
    {
        $result = [];

        // Affectations
        foreach ($batches as $batch) {
            $result[] = [
                'date' => Carbon::parse($batch['created_at'])->format('Y-m-d'),
                'type' => 'Affectation',
                'employee' => $batch['employee_name'] ?? 'N/A',
                'restaurant' => null,
                'tickets_count' => $batch['total_tickets'],
                'amount' => $batch['total_tickets'] * $batch['ticket_value']
            ];
        }

        // Consommations
        foreach ($orders as $order) {
            // Extraire le nom du restaurant depuis les items
            $restaurantName = null;
            if (isset($order['items']) && count($order['items']) > 0) {
                foreach ($order['items'] as $item) {
                    if (isset($item['restaurant_name'])) {
                        $restaurantName = $item['restaurant_name'];
                        break;
                    }
                }
            }
            
            // Si pas trouvé, utiliser un nom par défaut
            if (!$restaurantName) {
                $restaurantName = 'Restaurant #' . $order['restaurant_id'];
            }

            $result[] = [
                'date' => Carbon::parse($order['created_at'])->format('Y-m-d'),
                'type' => 'Consommation',
                'employee' => $order['employee_name'] ?? 'N/A',
                'restaurant' => $restaurantName,
                'tickets_count' => 1, // 1 commande = 1 ticket minimum
                'amount' => $order['ticket_amount_used'] ?? $order['total_amount']
            ];
        }

        // Trier par date
        usort($result, fn($a, $b) => $a['date'] <=> $b['date']);

        return $result;
    }

    /**
     * Réconciliation quotidienne
     */
    private function getReconciliation($batches, $orders, $startDate, $endDate)
    {
        $result = [];
        $cumulAssigned = 0;
        $cumulUsed = 0;

        $currentDate = $startDate->copy();

        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');

            // Affectations du jour
            $dayBatches = $batches->filter(function($batch) use ($dateStr) {
                return Carbon::parse($batch['created_at'])->format('Y-m-d') === $dateStr;
            });

            $assignedCount = $dayBatches->sum('total_tickets');
            $assignedAmount = $dayBatches->sum(fn($b) => $b['total_tickets'] * $b['ticket_value']);

            // Consommations du jour
            $dayOrders = $orders->filter(function($order) use ($dateStr) {
                return Carbon::parse($order['created_at'])->format('Y-m-d') === $dateStr;
            });

            $usedCount = $dayOrders->count(); // Nombre de commandes
            $usedAmount = $dayOrders->sum(fn($o) => $o['ticket_amount_used'] ?? $o['total_amount']);

            // Cumuls
            $cumulAssigned += $assignedAmount;
            $cumulUsed += $usedAmount;

            // Écarts
            $gapCount = $assignedCount - $usedCount;
            $gapAmount = $assignedAmount - $usedAmount;

            $result[] = [
                'date' => $dateStr,
                'assigned_count' => $assignedCount,
                'assigned_amount' => $assignedAmount,
                'used_count' => $usedCount,
                'used_amount' => $usedAmount,
                'gap_count' => $gapCount,
                'gap_amount' => $gapAmount,
                'cumul_assigned' => $cumulAssigned,
                'cumul_used' => $cumulUsed
            ];

            $currentDate->addDay();
        }

        return $result;
    }

    // ============ Chargement données ============

    private function loadCompanies()
    {
        return \App\Models\Company::all()->map(function($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
                'email' => $company->email,
                'phone' => $company->phone,
                'address' => $company->address
            ];
        })->toArray();
    }

    private function loadUsers()
    {
        return \App\Models\Employee::all()->toArray();
    }

    private function loadTicketBatches()
    {
        return \App\Models\TicketBatch::all()->toArray();
    }

    private function loadOrders()
    {
        return \App\Models\Order::all()->toArray();
    }

    private function loadRestaurants()
    {
        return \App\Models\Restaurant::all()->map(function($restaurant) {
            return [
                'id' => $restaurant->id,
                'name' => $restaurant->name,
                'email' => $restaurant->email,
                'phone' => $restaurant->phone,
                'address' => $restaurant->address
            ];
        })->toArray();
    }

    private function getMonthName($month)
    {
        $months = [
            1 => 'Jan', 2 => 'Fev', 3 => 'Mars', 4 => 'Avr',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juil', 8 => 'Aout',
            9 => 'Sept', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec'
        ];
        
        return $months[$month] ?? 'Mois' . $month;
    }
}
