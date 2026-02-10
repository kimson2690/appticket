<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\UserTicket;
use App\Models\TicketBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmployeeDashboardController extends Controller
{

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

            $employee = Employee::find($userId);

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

            $employee = Employee::find($userId);

            if (!$employee) {
                return response()->json(['error' => 'Employé non trouvé'], 404);
            }

            // Calculer depuis les vraies données des souches
            $employeeBatches = TicketBatch::where('employee_id', $userId)->get();
            $now = \Carbon\Carbon::now();

            // Souches vraiment actives = status 'active' ET validity_end >= now
            $realActiveBatches = $employeeBatches->filter(fn($b) =>
                $b->status === 'active' && \Carbon\Carbon::parse($b->validity_end)->gte($now)
            );
            // Souches expirées = status 'expired' OU (status 'active' mais date dépassée)
            $realExpiredBatches = $employeeBatches->filter(fn($b) =>
                $b->status === 'expired' || ($b->status === 'active' && \Carbon\Carbon::parse($b->validity_end)->lt($now))
            );

            // Tickets disponibles = remaining_tickets des souches vraiment actives
            $availableTickets = (int) $realActiveBatches->sum('remaining_tickets');

            // Tickets utilisés = used_tickets de TOUTES les souches
            $usedTickets = (int) $employeeBatches->sum('used_tickets');

            // Tickets expirés = remaining_tickets des souches expirées
            $expiredTickets = (int) $realExpiredBatches->sum('remaining_tickets');

            // Total = disponibles + utilisés + expirés
            $totalTickets = $availableTickets + $usedTickets + $expiredTickets;

            // Solde monétaire = somme des (remaining_tickets × ticket_value) des souches vraiment actives
            $ticketBalanceAmount = $realActiveBatches->sum(function ($batch) {
                return (int) $batch->remaining_tickets * (float) $batch->ticket_value;
            });

            $batchesCount = $employeeBatches->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'employee_name' => $employee->name,
                    'ticket_balance' => $ticketBalanceAmount,  // Montant en F
                    'tickets_count' => [
                        'total' => $totalTickets,               // Total basé sur les souches
                        'available' => $availableTickets,       // Nombre de tickets disponibles
                        'used' => $usedTickets,                 // Calculé : total - disponibles
                        'expired' => $expiredTickets
                    ],
                    'batches_count' => $batchesCount
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

            $employeeAssignments = UserTicket::where('employee_id', $userId)
                ->orderByDesc('created_at')
                ->get();

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

            $employeeBatches = TicketBatch::where('employee_id', $userId)
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $employeeBatches
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getMyBatches: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }
}
