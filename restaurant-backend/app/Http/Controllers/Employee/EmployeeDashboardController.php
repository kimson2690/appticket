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

            // Utiliser le ticket_balance de l'employé (source de vérité pour le montant en F)
            $ticketBalanceAmount = $employee->ticket_balance ?? 0;
            
            // Récupérer toutes les affectations de l'employé via Eloquent
            $totalTicketsAssigned = UserTicket::where('employee_id', $userId)
                ->sum('tickets_count');
            
            // Calculer la valeur unitaire moyenne des tickets via SQL
            $stats = UserTicket::where('employee_id', $userId)
                ->selectRaw('SUM(tickets_count * ticket_value) as total_value')
                ->selectRaw('SUM(tickets_count) as total_tickets')
                ->first();
            
            $totalValue = $stats->total_value ?? 0;
            $totalTickets = $stats->total_tickets ?? 0;
            $averageTicketValue = $totalTickets > 0 ? ($totalValue / $totalTickets) : 500;

            // Convertir le solde en nombre de tickets disponibles
            $availableTickets = $averageTicketValue > 0 ? floor($ticketBalanceAmount / $averageTicketValue) : 0;
            
            // Calculer les tickets utilisés = total - disponibles
            $usedTickets = $totalTicketsAssigned - $availableTickets;

            // Récupérer les tickets expirés via SQL
            $expiredTickets = TicketBatch::where('employee_id', $userId)
                ->where('status', 'expired')
                ->sum('remaining_tickets') ?? 0;

            $batchesCount = TicketBatch::where('employee_id', $userId)->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'employee_name' => $employee->name,
                    'ticket_balance' => $ticketBalanceAmount,  // Montant en F
                    'tickets_count' => [
                        'total' => $totalTicketsAssigned,      // Total basé sur les affectations
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
