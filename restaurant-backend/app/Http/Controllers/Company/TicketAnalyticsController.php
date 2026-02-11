<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\TicketBatch;
use App\Models\UserTicket;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TicketAnalyticsController extends Controller
{
    /**
     * Statistiques des tickets pour une entreprise
     */
    public function getTicketAnalytics(Request $request)
    {
        try {
            $companyId = $request->header('X-User-Company-Id');

            if (!$companyId) {
                return response()->json(['error' => 'Company ID manquant'], 401);
            }

            $now = Carbon::now();
            $employeeIds = Employee::where('company_id', $companyId)->pluck('id')->toArray();

            // Toutes les souches de l'entreprise
            $batches = TicketBatch::where('company_id', $companyId)->get();

            // Souches vraiment actives = status 'active' ET validity_end >= now
            // (certaines souches ont status='active' mais sont expirées en date)
            $activeBatches = $batches->filter(fn($b) =>
                $b->status === 'active' && Carbon::parse($b->validity_end)->gte($now)
            );
            // Expirées = status 'expired' OU (status 'active' mais date dépassée)
            $expiredBatches = $batches->filter(fn($b) =>
                $b->status === 'expired' || ($b->status === 'active' && Carbon::parse($b->validity_end)->lt($now))
            );

            // --- Statistiques globales (montants calculés par souche) ---
            $totalAssigned = (int) $batches->sum('total_tickets');
            $totalUsed = (int) $batches->sum('used_tickets');
            $totalRemaining = (int) $batches->sum('remaining_tickets');

            $totalAssignedAmount = (float) $batches->sum(fn($b) => (int) $b->total_tickets * (float) $b->ticket_value);
            $totalUsedAmount = (float) $batches->sum(fn($b) => (int) $b->used_tickets * (float) $b->ticket_value);

            // Tickets actifs (disponibles)
            $validRemaining = (int) $activeBatches->sum('remaining_tickets');
            $validRemainingAmount = (float) $activeBatches->sum(fn($b) => (int) $b->remaining_tickets * (float) $b->ticket_value);

            // Tickets expirés (perdus)
            $expiredRemaining = (int) $expiredBatches->sum('remaining_tickets');
            $expiredRemainingAmount = (float) $expiredBatches->sum(fn($b) => (int) $b->remaining_tickets * (float) $b->ticket_value);

            // Taux
            $usageRate = $totalAssigned > 0 ? round(($totalUsed / $totalAssigned) * 100, 1) : 0;
            $expiryRate = $totalAssigned > 0 ? round(($expiredRemaining / $totalAssigned) * 100, 1) : 0;

            // --- Répartition pour le PieChart ---
            $distribution = [
                ['name' => 'Utilisés', 'value' => $totalUsed, 'amount' => $totalUsedAmount, 'color' => '#10b981'],
                ['name' => 'Disponibles (valides)', 'value' => $validRemaining, 'amount' => $validRemainingAmount, 'color' => '#3b82f6'],
                ['name' => 'Expirés (perdus)', 'value' => $expiredRemaining, 'amount' => $expiredRemainingAmount, 'color' => '#ef4444'],
            ];

            // --- Évolution par mois (6 derniers mois) ---
            $monthlyData = [];
            for ($i = 5; $i >= 0; $i--) {
                $start = now()->subMonths($i)->startOfMonth();
                $end = now()->subMonths($i)->endOfMonth();

                $monthBatches = $batches->filter(fn($b) => Carbon::parse($b->created_at)->between($start, $end));
                $assigned = (int) $monthBatches->sum('total_tickets');

                // Commandes confirmées du mois (montant réel dépensé)
                $usedAmount = (float) Order::whereIn('employee_id', $employeeIds)
                    ->where('status', 'confirmed')
                    ->whereBetween('created_at', [$start, $end])
                    ->sum('total_amount');

                // Souches expirées dans ce mois
                $expiredInMonth = $batches->filter(fn($b) => Carbon::parse($b->validity_end)->between($start, $end));
                $expired = (int) $expiredInMonth->sum('remaining_tickets');

                $monthlyData[] = [
                    'month' => $start->translatedFormat('M y'),
                    'assigned' => $assigned,
                    'used_amount' => $usedAmount,
                    'expired' => $expired,
                ];
            }

            // --- Par employé : solde valide ---
            $employeeStats = [];
            $employees = Employee::where('company_id', $companyId)->where('status', 'active')->get();
            foreach ($employees as $emp) {
                $empBatches = $batches->filter(fn($b) => (string) $b->employee_id === (string) $emp->id);
                $empActiveBatches = $empBatches->filter(fn($b) =>
                    $b->status === 'active' && Carbon::parse($b->validity_end)->gte($now)
                );
                $empExpiredBatches = $empBatches->filter(fn($b) =>
                    $b->status === 'expired' || ($b->status === 'active' && Carbon::parse($b->validity_end)->lt($now))
                );

                $empValidAmount = (float) $empActiveBatches->sum(fn($b) => (int) $b->remaining_tickets * (float) $b->ticket_value);
                $empUsedAmount = (float) $empBatches->sum(fn($b) => (int) $b->used_tickets * (float) $b->ticket_value);
                $empExpiredAmount = (float) $empExpiredBatches->sum(fn($b) => (int) $b->remaining_tickets * (float) $b->ticket_value);
                $empTotalUsed = (int) $empBatches->sum('used_tickets');
                $empValidRemaining = (int) $empActiveBatches->sum('remaining_tickets');
                $empExpiredRemaining = (int) $empExpiredBatches->sum('remaining_tickets');

                // Cumul réel reçu = somme (total_tickets × ticket_value) de toutes les souches
                $empTotalReceived = (float) $empBatches->sum(fn($b) => (int) $b->total_tickets * (float) $b->ticket_value);

                $employeeStats[] = [
                    'name' => $emp->name,
                    'valid_remaining' => $empValidRemaining,
                    'valid_remaining_amount' => $empValidAmount,
                    'used' => $empTotalUsed,
                    'used_amount' => $empUsedAmount,
                    'expired_remaining' => $empExpiredRemaining,
                    'expired_amount' => $empExpiredAmount,
                    'total_received' => $empTotalReceived,
                ];
            }

            // Trier par solde valide décroissant
            usort($employeeStats, fn($a, $b) => $b['valid_remaining_amount'] <=> $a['valid_remaining_amount']);

            // --- Souches bientôt expirées (dans les 7 prochains jours) ---
            $soonExpiring = $activeBatches->filter(function ($b) use ($now) {
                $end = Carbon::parse($b->validity_end);
                return $end->diffInDays($now) <= 7 && $b->remaining_tickets > 0;
            })->map(function ($b) {
                return [
                    'batch_number' => $b->batch_number,
                    'employee_name' => $b->employee_name,
                    'remaining_tickets' => (int) $b->remaining_tickets,
                    'remaining_amount' => (float) ((int) $b->remaining_tickets * (float) $b->ticket_value),
                    'validity_end' => Carbon::parse($b->validity_end)->format('d/m/Y'),
                    'days_left' => (int) Carbon::now()->diffInDays(Carbon::parse($b->validity_end), false),
                ];
            })->values()->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_assigned' => $totalAssigned,
                        'total_assigned_amount' => $totalAssignedAmount,
                        'total_used' => $totalUsed,
                        'total_used_amount' => $totalUsedAmount,
                        'valid_remaining' => $validRemaining,
                        'valid_remaining_amount' => $validRemainingAmount,
                        'expired_remaining' => $expiredRemaining,
                        'expired_remaining_amount' => $expiredRemainingAmount,
                        'usage_rate' => $usageRate,
                        'expiry_rate' => $expiryRate,
                        'total_batches' => $batches->count(),
                        'valid_batches' => $activeBatches->count(),
                        'expired_batches' => $expiredBatches->count(),
                    ],
                    'distribution' => $distribution,
                    'monthly_data' => $monthlyData,
                    'by_employee' => array_slice($employeeStats, 0, 20),
                    'soon_expiring' => $soonExpiring,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('❌ [TicketAnalytics] Erreur', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }
}
