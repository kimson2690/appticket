<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\DirectPayment;
use App\Services\ExcelReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
            $directPayments = $this->loadDirectPayments();

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
            $data = $this->calculateReportData($users, $ticketBatches, $orders, $directPayments, $month, $year, $companyName);

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
            $directPayments = $this->loadDirectPayments();

            // Filtrer par entreprise
            if ($userRole === 'Gestionnaire Entreprise') {
                $users = array_filter($users, fn($u) => (string)$u['company_id'] === (string)$companyId);
                $ticketBatches = array_filter($ticketBatches, fn($b) => (string)$b['company_id'] === (string)$companyId);
                $companies = array_filter($companies, fn($c) => (string)$c['id'] === (string)$companyId);
            }

            $company = collect($companies)->first();
            $companyName = $company['name'] ?? 'Entreprise';

            // Calculer les données
            $data = $this->calculateReportData($users, $ticketBatches, $orders, $directPayments, $month, $year, $companyName);

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
    private function calculateReportData($users, $ticketBatches, $orders, $directPayments, $month, $year, $companyName)
    {
        // Convertir en collections
        $users = collect($users);
        $ticketBatches = collect($ticketBatches);
        $orders = collect($orders);
        $directPayments = collect($directPayments);

        // IDs des employés de l'entreprise
        $employeeIds = $users->pluck('id')->map(fn($id) => (string)$id)->toArray();

        // Début et fin du mois
        $startDate = Carbon::create($year, $month, 1)->startOfDay();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth()->endOfDay();

        // Filtrer les souches du mois pour cette entreprise
        $monthBatches = $ticketBatches->filter(function($batch) use ($startDate, $endDate) {
            $createdAt = Carbon::parse($batch['created_at']);
            return $createdAt->between($startDate, $endDate);
        });

        // Filtrer les commandes du mois pour les employés de cette entreprise uniquement
        $monthOrders = $orders->filter(function($order) use ($startDate, $endDate, $employeeIds) {
            $createdAt = Carbon::parse($order['created_at']);
            return $createdAt->between($startDate, $endDate)
                && $order['status'] === 'confirmed'
                && in_array((string)$order['employee_id'], $employeeIds);
        });

        // Filtrer les paiements directs du mois (consommations)
        $monthDirectPayments = $directPayments->filter(function($dp) use ($startDate, $endDate, $employeeIds) {
            $createdAt = Carbon::parse($dp['created_at']);
            return $createdAt->between($startDate, $endDate)
                && ($dp['status'] ?? null) === 'completed'
                && in_array((string)$dp['employee_id'], $employeeIds);
        });

        // Total consommations (commandes confirmées + paiements directs)
        $monthConsumptions = $monthOrders->values()->merge($monthDirectPayments->values());

        // Déterminer la valeur unitaire d'un ticket (depuis les souches du mois ou toutes les souches)
        $ticketValue = $monthBatches->avg('ticket_value');
        if (!$ticketValue) {
            $ticketValue = $ticketBatches->avg('ticket_value');
        }
        $ticketValue = (float)($ticketValue ?: 500); // Fallback 500F

        // Calculer les totaux affectés
        $ticketsAssignedCount = (int)$monthBatches->sum('total_tickets');
        $ticketsAssignedAmount = (float)$monthBatches->sum(function($batch) {
            return (int)$batch['total_tickets'] * (float)$batch['ticket_value'];
        });

        // Calculer les tickets réellement consommés (montant / valeur unitaire ticket)
        $ticketsUsedAmount = (float)$monthConsumptions->sum(function($entry) {
            return (float)($entry['ticket_amount_used'] ?? $entry['amount'] ?? $entry['total_amount']);
        });
        $ticketsUsedCount = $ticketValue > 0 ? (int)round($ticketsUsedAmount / $ticketValue) : 0;

        // Nombre de commandes (distinct du nombre de tickets)
        $ordersCount = $monthConsumptions->count();

        // Tickets restants
        $ticketsRemainingCount = max(0, $ticketsAssignedCount - $ticketsUsedCount);
        $ticketsRemainingAmount = max(0, $ticketsAssignedAmount - $ticketsUsedAmount);

        // Taux d'utilisation
        $usageRate = $ticketsAssignedCount > 0 ? ($ticketsUsedCount / $ticketsAssignedCount) * 100 : 0;

        // Statistiques
        $activeEmployees = $users->where('status', 'active')->count();
        $restaurantsUsed = $monthConsumptions->pluck('restaurant_id')->unique()->count();
        $averageOrderAmount = $ordersCount > 0 ? round($ticketsUsedAmount / $ordersCount, 0) : 0;

        // Charger les noms de restaurants
        $restaurants = \App\Models\Restaurant::all()->keyBy('id');

        // Données par employé
        $byEmployee = $this->getDataByEmployee($users, $monthBatches, $monthOrders, $monthDirectPayments, $ticketValue, $restaurants);

        // Données par restaurant
        $byRestaurant = $this->getDataByRestaurant($monthOrders, $monthDirectPayments, $restaurants);

        // Données par date
        $byDate = $this->getDataByDate($monthBatches, $monthOrders, $monthDirectPayments, $ticketValue, $restaurants);

        // Réconciliation
        $reconciliation = $this->getReconciliation($monthBatches, $monthOrders, $monthDirectPayments, $startDate, $endDate, $ticketValue);

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
                'restaurants_count' => $restaurantsUsed,
                'orders_count' => $ordersCount,
                'average_order_amount' => (float)$averageOrderAmount,
                'ticket_value' => $ticketValue,
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
    private function getDataByEmployee($users, $batches, $orders, $directPayments, $ticketValue, $restaurants)
    {
        $result = [];

        $directPayments = collect($directPayments);

        foreach ($users as $user) {
            if ($user['status'] !== 'active') continue;

            $userId = (string)$user['id'];

            // Tickets affectés
            $userBatches = $batches->filter(fn($b) => (string)$b['employee_id'] === $userId);
            $ticketsAssigned = (int)$userBatches->sum('total_tickets');
            $amountAssigned = (float)$userBatches->sum(fn($b) => (int)$b['total_tickets'] * (float)$b['ticket_value']);

            // Tickets consommés (montant / valeur ticket)
            $userOrders = $orders->filter(fn($o) => (string)$o['employee_id'] === $userId);
            $userDirectPayments = $directPayments->filter(fn($dp) => (string)$dp['employee_id'] === $userId);

            $amountUsed = (float)$userOrders->sum(fn($o) => (float)($o['ticket_amount_used'] ?? $o['total_amount']))
                + (float)$userDirectPayments->sum(fn($dp) => (float)($dp['ticket_amount_used'] ?? $dp['amount']));
            $ticketsUsed = $ticketValue > 0 ? (int)round($amountUsed / $ticketValue) : 0;
            $ordersCount = $userOrders->count() + $userDirectPayments->count();

            // Restaurants fréquentés
            $userRestaurants = $userOrders->values()->merge($userDirectPayments->values())
                ->pluck('restaurant_id')
                ->unique()
                ->map(function($rid) use ($restaurants) {
                $r = $restaurants->get($rid);
                return $r ? $r->name : null;
            })->filter()->values()->toArray();

            // Calculs
            $ticketsRemaining = max(0, $ticketsAssigned - $ticketsUsed);
            $balance = max(0, $amountAssigned - $amountUsed);
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
                'usage_rate' => round($usageRate, 2),
                'orders_count' => $ordersCount,
                'restaurants' => $userRestaurants,
            ];
        }

        return $result;
    }

    /**
     * Données par restaurant
     */
    private function getDataByRestaurant($orders, $directPayments, $restaurants)
    {
        $result = [];

        $orders = collect($orders);
        $directPayments = collect($directPayments);

        $consumptions = $orders->values()->merge($directPayments->values());

        $totalAmount = (float)$consumptions->sum(fn($o) => (float)($o['ticket_amount_used'] ?? $o['amount'] ?? $o['total_amount']));

        $grouped = $consumptions->groupBy('restaurant_id');

        foreach ($grouped as $restaurantId => $restaurantOrders) {
            // Nom du restaurant depuis le modèle
            $restaurant = $restaurants->get($restaurantId);
            if (!$restaurant) continue; // Ignorer les restaurants supprimés

            $ordersCount = $restaurantOrders->count();
            $amount = (float)$restaurantOrders->sum(fn($o) => (float)($o['ticket_amount_used'] ?? $o['amount'] ?? $o['total_amount']));
            $average = $ordersCount > 0 ? $amount / $ordersCount : 0;
            $percentage = $totalAmount > 0 ? ($amount / $totalAmount) * 100 : 0;

            $result[] = [
                'name' => $restaurant->name,
                'address' => $restaurant->address ?? 'N/A',
                'phone' => $restaurant->phone ?? 'N/A',
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
    private function getDataByDate($batches, $orders, $directPayments, $ticketValue, $restaurants)
    {
        $result = [];

        $directPayments = collect($directPayments);

        // Affectations
        foreach ($batches as $batch) {
            $result[] = [
                'date' => Carbon::parse($batch['created_at'])->format('Y-m-d'),
                'type' => 'Affectation',
                'employee' => $batch['employee_name'] ?? 'N/A',
                'restaurant' => null,
                'tickets_count' => (int)$batch['total_tickets'],
                'amount' => (float)((int)$batch['total_tickets'] * (float)$batch['ticket_value'])
            ];
        }

        // Consommations
        foreach ($orders as $order) {
            $restaurant = $restaurants->get($order['restaurant_id']);
            $restaurantName = $restaurant ? $restaurant->name : 'Restaurant #' . $order['restaurant_id'];
            $amount = (float)($order['ticket_amount_used'] ?? $order['total_amount']);
            $ticketsCount = $ticketValue > 0 ? (int)round($amount / $ticketValue) : 1;

            $result[] = [
                'date' => Carbon::parse($order['created_at'])->format('Y-m-d'),
                'type' => 'Consommation',
                'employee' => $order['employee_name'] ?? 'N/A',
                'restaurant' => $restaurantName,
                'tickets_count' => $ticketsCount,
                'amount' => $amount
            ];
        }

        foreach ($directPayments as $dp) {
            $restaurant = $restaurants->get($dp['restaurant_id']);
            $restaurantName = $restaurant ? $restaurant->name : 'Restaurant #' . $dp['restaurant_id'];
            $amount = (float)($dp['ticket_amount_used'] ?? $dp['amount']);
            $ticketsCount = $ticketValue > 0 ? (int)round($amount / $ticketValue) : 1;

            $result[] = [
                'date' => Carbon::parse($dp['created_at'])->format('Y-m-d'),
                'type' => 'Paiement Direct',
                'employee' => $dp['employee_name'] ?? 'N/A',
                'restaurant' => $restaurantName,
                'tickets_count' => $ticketsCount,
                'amount' => $amount
            ];
        }

        // Trier par date
        usort($result, fn($a, $b) => $a['date'] <=> $b['date']);

        return $result;
    }

    /**
     * Réconciliation quotidienne
     */
    private function getReconciliation($batches, $orders, $directPayments, $startDate, $endDate, $ticketValue)
    {
        $result = [];
        $cumulAssigned = 0;
        $cumulUsed = 0;

        $directPayments = collect($directPayments);

        $currentDate = $startDate->copy();

        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');

            // Affectations du jour
            $dayBatches = $batches->filter(function($batch) use ($dateStr) {
                return Carbon::parse($batch['created_at'])->format('Y-m-d') === $dateStr;
            });

            $assignedCount = (int)$dayBatches->sum('total_tickets');
            $assignedAmount = (float)$dayBatches->sum(fn($b) => (int)$b['total_tickets'] * (float)$b['ticket_value']);

            // Consommations du jour
            $dayOrders = $orders->filter(function($order) use ($dateStr) {
                return Carbon::parse($order['created_at'])->format('Y-m-d') === $dateStr;
            });

            $dayDirectPayments = $directPayments->filter(function($dp) use ($dateStr) {
                return Carbon::parse($dp['created_at'])->format('Y-m-d') === $dateStr;
            });

            $usedAmount = (float)$dayOrders->sum(fn($o) => (float)($o['ticket_amount_used'] ?? $o['total_amount']))
                + (float)$dayDirectPayments->sum(fn($dp) => (float)($dp['ticket_amount_used'] ?? $dp['amount']));
            $usedCount = $ticketValue > 0 ? (int)round($usedAmount / $ticketValue) : ($dayOrders->count() + $dayDirectPayments->count());

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

    private function loadDirectPayments()
    {
        return DirectPayment::all()->toArray();
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
