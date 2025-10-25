<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EmployeeDashboardController extends Controller
{
    private $employeesFile = 'employees.json';
    private $assignmentsFile = 'ticket_assignments.json';
    private $batchesFile = 'ticket_batches.json';

    /**
     * Récupérer les informations de l'employé connecté
     */
    public function getProfile(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');
            
            if (!$userId) {
                return response()->json(['error' => 'User ID manquant'], 401);
            }

            $employees = $this->loadEmployees();
            $employee = collect($employees)->firstWhere('id', $userId);

            if (!$employee) {
                return response()->json(['error' => 'Employé non trouvé'], 404);
            }

            Log::info('Profil employé récupéré', ['employee_id' => $userId]);

            return response()->json([
                'success' => true,
                'data' => $employee
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getProfile: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer le solde de tickets de l'employé
     */
    public function getTicketBalance(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');
            
            if (!$userId) {
                return response()->json(['error' => 'User ID manquant'], 401);
            }

            $employees = $this->loadEmployees();
            $employee = collect($employees)->firstWhere('id', $userId);

            if (!$employee) {
                return response()->json(['error' => 'Employé non trouvé'], 404);
            }

            // Utiliser le ticket_balance de l'employé (source de vérité pour le montant en F)
            $ticketBalanceAmount = $employee['ticket_balance'] ?? 0;
            
            // Récupérer toutes les affectations de l'employé pour calculer le total
            $assignments = $this->loadAssignments();
            $employeeAssignments = collect($assignments)->where('employee_id', $userId);
            
            $totalTicketsAssigned = $employeeAssignments->sum('tickets_count');
            
            // Calculer la valeur unitaire moyenne des tickets
            $totalValue = 0;
            $totalTickets = 0;
            foreach ($employeeAssignments as $assignment) {
                $totalValue += ($assignment['tickets_count'] * $assignment['ticket_value']);
                $totalTickets += $assignment['tickets_count'];
            }
            $averageTicketValue = $totalTickets > 0 ? ($totalValue / $totalTickets) : 500;

            // Convertir le solde en nombre de tickets disponibles
            $availableTickets = $averageTicketValue > 0 ? floor($ticketBalanceAmount / $averageTicketValue) : 0;
            
            // Calculer les tickets utilisés = total - disponibles
            $usedTickets = $totalTicketsAssigned - $availableTickets;

            // Récupérer les souches pour calculer les expirés
            $batches = $this->loadBatches();
            $employeeBatches = collect($batches)->where('employee_id', $userId);
            $expiredTickets = 0;

            foreach ($employeeBatches as $batch) {
                if ($batch['status'] === 'expired') {
                    $expiredTickets += $batch['remaining_tickets'] ?? 0;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'employee_name' => $employee['name'],
                    'ticket_balance' => $ticketBalanceAmount,  // Montant en F
                    'tickets_count' => [
                        'total' => $totalTicketsAssigned,      // Total basé sur les affectations
                        'available' => $availableTickets,       // Nombre de tickets disponibles
                        'used' => $usedTickets,                 // Calculé : total - disponibles
                        'expired' => $expiredTickets
                    ],
                    'batches_count' => $employeeBatches->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getTicketBalance: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer l'historique des tickets de l'employé
     */
    public function getTicketHistory(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');
            
            if (!$userId) {
                return response()->json(['error' => 'User ID manquant'], 401);
            }

            $assignments = $this->loadAssignments();
            $employeeAssignments = collect($assignments)
                ->where('employee_id', $userId)
                ->sortByDesc('created_at')
                ->values()
                ->all();

            return response()->json([
                'success' => true,
                'data' => $employeeAssignments
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getTicketHistory: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer les souches de tickets de l'employé
     */
    public function getMyBatches(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');
            
            if (!$userId) {
                return response()->json(['error' => 'User ID manquant'], 401);
            }

            $batches = $this->loadBatches();
            $employeeBatches = collect($batches)
                ->where('employee_id', $userId)
                ->sortByDesc('created_at')
                ->values()
                ->all();

            return response()->json([
                'success' => true,
                'data' => $employeeBatches
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getMyBatches: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
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
     * Charger les affectations
     */
    private function loadAssignments()
    {
        $filePath = storage_path('app/' . $this->assignmentsFile);
        
        if (!file_exists($filePath)) {
            return [];
        }

        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }

    /**
     * Charger les souches
     */
    private function loadBatches()
    {
        $filePath = storage_path('app/' . $this->batchesFile);
        
        if (!file_exists($filePath)) {
            return [];
        }

        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }
}
