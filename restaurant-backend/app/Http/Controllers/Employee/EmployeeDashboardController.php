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

            // Récupérer les souches assignées à cet employé
            $batches = $this->loadBatches();
            $employeeBatches = collect($batches)->where('employee_id', $userId);

            // Calculer les tickets disponibles, utilisés et expirés
            $totalTickets = 0;
            $availableTickets = 0;
            $usedTickets = 0;
            $expiredTickets = 0;

            foreach ($employeeBatches as $batch) {
                $totalTickets += $batch['total_tickets'];
                
                if ($batch['status'] === 'active') {
                    $availableTickets += $batch['remaining_tickets'];
                    $usedTickets += $batch['used_tickets'];
                } elseif ($batch['status'] === 'expired') {
                    $expiredTickets += $batch['remaining_tickets'];
                    $usedTickets += $batch['used_tickets'];
                } elseif ($batch['status'] === 'depleted') {
                    $usedTickets += $batch['total_tickets'];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'employee_name' => $employee['name'],
                    'ticket_balance' => $employee['ticket_balance'] ?? 0,
                    'tickets_count' => [
                        'total' => $totalTickets,
                        'available' => $availableTickets,
                        'used' => $usedTickets,
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
        if (!Storage::disk('local')->exists($this->employeesFile)) {
            return [];
        }

        $content = Storage::disk('local')->get($this->employeesFile);
        return json_decode($content, true) ?? [];
    }

    /**
     * Charger les affectations
     */
    private function loadAssignments()
    {
        if (!Storage::disk('local')->exists($this->assignmentsFile)) {
            return [];
        }

        $content = Storage::disk('local')->get($this->assignmentsFile);
        return json_decode($content, true) ?? [];
    }

    /**
     * Charger les souches
     */
    private function loadBatches()
    {
        if (!Storage::disk('local')->exists($this->batchesFile)) {
            return [];
        }

        $content = Storage::disk('local')->get($this->batchesFile);
        return json_decode($content, true) ?? [];
    }
}
