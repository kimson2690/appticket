<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\NotificationController;
use App\Models\DirectPayment;
use App\Models\Employee;
use App\Models\Restaurant;
use App\Models\Company;
use App\Models\TicketBatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class DirectPaymentController extends Controller
{
    /**
     * Effectuer un paiement direct par tickets
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'restaurant_id' => 'required|integer|exists:restaurants,id',
                'amount' => 'required|numeric|min:1',
                'notes' => 'nullable|string|max:500',
            ]);

            $userId = $request->header('X-User-Id');
            $userName = $request->header('X-User-Name', 'Employé');

            if (!$userId) {
                return response()->json(['success' => false, 'message' => 'User ID manquant'], 401);
            }

            $employee = Employee::find($userId);
            if (!$employee) {
                return response()->json(['success' => false, 'message' => 'Employé non trouvé'], 404);
            }

            // Vérifier que l'entreprise a le mode paiement direct (ordering_enabled = false)
            $company = Company::find($employee->company_id);
            if (!$company) {
                return response()->json(['success' => false, 'message' => 'Entreprise non trouvée'], 404);
            }

            $restaurant = Restaurant::find($validated['restaurant_id']);
            if (!$restaurant) {
                return response()->json(['success' => false, 'message' => 'Restaurant non trouvé'], 404);
            }

            $amount = $validated['amount'];

            // Vérifier le solde de tickets (souches actives et valides)
            $ticketBalance = TicketBatch::where('company_id', $employee->company_id)
                ->where('status', 'active')
                ->where('validity_end', '>=', now())
                ->get()
                ->reduce(function ($carry, $batch) {
                    return $carry + ($batch->remaining_tickets * $batch->ticket_value);
                }, 0);

            // Vérifier aussi le solde direct de l'employé
            $employeeBalance = $employee->ticket_balance ?? 0;
            $availableBalance = max($ticketBalance, $employeeBalance);

            if ($availableBalance < $amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde de tickets insuffisant',
                    'required' => $amount,
                    'available' => $availableBalance
                ], 400);
            }

            DB::beginTransaction();

            // Générer un ID unique et une référence
            $paymentId = 'dp_' . time() . '_' . rand(1000, 9999);
            $reference = 'PAY-' . strtoupper(substr(md5($paymentId), 0, 8));

            // Créer le paiement direct
            $payment = DirectPayment::create([
                'id' => $paymentId,
                'employee_id' => $userId,
                'employee_name' => $userName,
                'restaurant_id' => $validated['restaurant_id'],
                'company_id' => $employee->company_id,
                'amount' => $amount,
                'ticket_amount_used' => $amount,
                'reference' => $reference,
                'notes' => $validated['notes'] ?? null,
                'status' => 'completed',
            ]);

            // Déduire du solde de l'employé
            $employee->ticket_balance = max(0, $employee->ticket_balance - $amount);
            $employee->save();

            // Déduire des souches de tickets (FIFO - plus ancienne d'abord)
            $this->deductFromBatches($userId, $employee->company_id, $amount);

            DB::commit();

            $restaurantName = $restaurant->name;
            $formattedAmount = number_format($amount, 0, ',', ' ') . 'F';

            Log::info("Paiement direct {$paymentId}: {$userName} → {$restaurantName} - {$formattedAmount}");

            // Notification pour l'employé
            NotificationController::createNotification([
                'type' => 'success',
                'title' => '💳 Paiement effectué',
                'message' => "Paiement de {$formattedAmount} effectué chez {$restaurantName}. Réf: {$reference}",
                'user_id' => $userId,
                'action_url' => '/admin/my-history',
                'metadata' => [
                    'payment_id' => $paymentId,
                    'restaurant_name' => $restaurantName,
                    'amount' => $amount,
                    'reference' => $reference,
                    'type' => 'direct_payment'
                ]
            ]);

            // Notification pour le gestionnaire du restaurant
            NotificationController::createNotification([
                'type' => 'success',
                'title' => '💰 Paiement reçu',
                'message' => "{$userName} a effectué un paiement de {$formattedAmount} par tickets. Réf: {$reference}",
                'restaurant_id' => $restaurant->id,
                'role' => 'Gestionnaire Restaurant',
                'action_url' => '/admin/orders',
                'metadata' => [
                    'payment_id' => $paymentId,
                    'employee_name' => $userName,
                    'amount' => $amount,
                    'reference' => $reference,
                    'type' => 'direct_payment_received'
                ]
            ]);

            // Notification pour le gestionnaire de l'entreprise
            NotificationController::createNotification([
                'type' => 'info',
                'title' => '📊 Paiement employé',
                'message' => "{$userName} a payé {$formattedAmount} chez {$restaurantName}. Réf: {$reference}",
                'company_id' => $employee->company_id,
                'role' => 'Gestionnaire Entreprise',
                'metadata' => [
                    'payment_id' => $paymentId,
                    'employee_name' => $userName,
                    'restaurant_name' => $restaurantName,
                    'amount' => $amount,
                    'reference' => $reference,
                    'type' => 'employee_direct_payment'
                ]
            ]);

            // Envoyer WhatsApp si le service est disponible
            try {
                $whatsappService = app(\App\Services\WhatsAppService::class);
                if ($whatsappService->isReady() && $employee->phone) {
                    $whatsappService->sendMessage(
                        $employee->phone,
                        "💳 *Paiement confirmé*\n\n" .
                        "Restaurant: {$restaurantName}\n" .
                        "Montant: {$formattedAmount}\n" .
                        "Référence: {$reference}\n\n" .
                        "Merci d'utiliser AppTicket !"
                    );
                }
            } catch (\Exception $e) {
                Log::warning('WhatsApp non envoyé pour paiement direct: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => "Paiement de {$formattedAmount} effectué avec succès chez {$restaurantName}",
                'data' => [
                    'id' => $payment->id,
                    'reference' => $reference,
                    'amount' => $amount,
                    'restaurant_name' => $restaurantName,
                    'new_balance' => $employee->ticket_balance,
                    'created_at' => $payment->created_at->toDateTimeString(),
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur paiement direct: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Historique des paiements directs d'un employé
     */
    public function history(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');
            if (!$userId) {
                return response()->json(['success' => false, 'message' => 'User ID manquant'], 401);
            }

            $payments = DirectPayment::where('employee_id', $userId)
                ->with('restaurant:id,name')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'reference' => $payment->reference,
                        'restaurant_name' => $payment->restaurant->name ?? 'Restaurant',
                        'restaurant_id' => $payment->restaurant_id,
                        'amount' => (float) $payment->amount,
                        'status' => $payment->status,
                        'notes' => $payment->notes,
                        'created_at' => $payment->created_at->toDateTimeString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $payments
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur historique paiements: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Déduire des souches de tickets (FIFO - plus ancienne d'abord)
     */
    private function deductFromBatches($employeeId, $companyId, $amount)
    {
        // Chercher les souches actives et valides de l'employé (ou de l'entreprise)
        $batches = TicketBatch::where(function ($q) use ($employeeId, $companyId) {
                $q->where('employee_id', $employeeId)
                  ->orWhere('company_id', $companyId);
            })
            ->where('status', 'active')
            ->where('validity_end', '>=', now())
            ->where('remaining_tickets', '>', 0)
            ->orderBy('validity_end', 'asc') // Plus proche de l'expiration d'abord
            ->get();

        $remainingAmount = $amount;

        foreach ($batches as $batch) {
            if ($remainingAmount <= 0) break;

            $ticketValue = $batch->ticket_value ?? 500;
            $ticketsNeeded = ceil($remainingAmount / $ticketValue);
            $ticketsToDeduct = min($ticketsNeeded, $batch->remaining_tickets);

            $batch->increment('used_tickets', $ticketsToDeduct);
            $batch->decrement('remaining_tickets', $ticketsToDeduct);

            $remainingAmount -= ($ticketsToDeduct * $ticketValue);

            Log::info("Souche {$batch->id} mise à jour: -{$ticketsToDeduct} tickets (paiement direct)");
        }
    }

    /**
     * Vérifier si le mode paiement direct est activé pour l'entreprise de l'employé
     */
    public function checkMode(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');
            if (!$userId) {
                return response()->json(['success' => false, 'message' => 'User ID manquant'], 401);
            }

            $employee = Employee::find($userId);
            if (!$employee || !$employee->company_id) {
                return response()->json([
                    'success' => true,
                    'data' => ['ordering_enabled' => true]
                ]);
            }

            $company = Company::find($employee->company_id);

            return response()->json([
                'success' => true,
                'data' => [
                    'ordering_enabled' => $company ? (bool) $company->ordering_enabled : true,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }
}
