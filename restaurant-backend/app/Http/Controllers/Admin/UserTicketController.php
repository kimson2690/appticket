<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\TicketsAssigned;
use App\Helpers\EmailPriority;

class UserTicketController extends Controller
{
    /**
     * Assign tickets to an employee.
     */
    public function assignTickets(Request $request, string $employeeId): JsonResponse
    {
        try {
            Log::info('UserTicketController@assignTickets - Employee ID: ' . $employeeId);
            Log::info('Données reçues:', $request->all());

            // Validation
            $request->validate([
                'tickets_count' => 'required|integer|min:1',
                'batch_id' => 'nullable|string',
                'ticket_value' => 'nullable|integer|min:100',
                'validity_days' => 'nullable|integer|min:1',
                'notes' => 'nullable|string'
            ]);

            $ticketsCount = $request->input('tickets_count');
            $batchId = $request->input('batch_id');
            $ticketValue = $request->input('ticket_value');
            $validityDays = $request->input('validity_days');
            $notes = $request->input('notes', '');

            // Trouver l'employé en MySQL
            $employee = \App\Models\Employee::find($employeeId);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Variables pour la validité
            $validityStart = null;
            $validityEnd = null;
            $createdBatchId = $batchId;

            // Si une souche existante est spécifiée, utiliser ses valeurs
            if ($batchId) {
                $batch = \App\Models\TicketBatch::find($batchId);
                if ($batch) {
                    $ticketValue = $batch->ticket_value;
                    $validityStart = $batch->validity_start;
                    $validityEnd = $batch->validity_end;
                }
            }

            // Valeur par défaut si non spécifiée
            if (!$ticketValue) {
                $ticketValue = 500;
            }

            // Calculer dates de validité
            if (!$validityStart) {
                $validityStart = date('Y-m-d');
                $validityDays = $validityDays ?: 30;
                $validityEnd = date('Y-m-d', strtotime("+{$validityDays} days"));
            }

            // Si pas de souche existante, en créer une nouvelle pour cet employé
            if (!$batchId) {
                $companyId = $employee->company_id;
                preg_match_all('/\d+/', $companyId, $matches);
                $companyCode = !empty($matches[0]) ? 'E' . implode('', $matches[0]) : 'E000';
                $batchCounter = \App\Models\TicketBatch::where('company_id', $companyId)->count() + 1;
                $timestamp = time();

                $batchNumber = 'SOUCHE-' . $companyCode . '-' . date('Ymd') . '-' . str_pad($batchCounter, 4, '0', STR_PAD_LEFT);
                $createdBatchId = 'batch_' . $timestamp . '_' . $batchCounter;

                // Générer les tickets individuels
                $tickets = [];
                for ($i = 1; $i <= $ticketsCount; $i++) {
                    $ticketNumber = $batchNumber . '-T' . str_pad($i, 3, '0', STR_PAD_LEFT);
                    $tickets[] = [
                        'ticket_number' => $ticketNumber,
                        'value' => $ticketValue,
                        'status' => 'available',
                        'used_at' => null
                    ];
                }

                $userName = $request->header('X-User-Name', 'Système');

                \App\Models\TicketBatch::create([
                    'id' => $createdBatchId,
                    'batch_number' => $batchNumber,
                    'company_id' => $companyId,
                    'config_id' => null,
                    'employee_id' => $employeeId,
                    'employee_name' => $employee->name,
                    'created_by' => $userName,
                    'total_tickets' => $ticketsCount,
                    'ticket_value' => $ticketValue,
                    'type' => 'standard',
                    'validity_start' => $validityStart,
                    'validity_end' => $validityEnd,
                    'assigned_tickets' => $ticketsCount,
                    'used_tickets' => 0,
                    'remaining_tickets' => $ticketsCount,
                    'status' => 'active',
                    'tickets' => $tickets
                ]);

                Log::info("Souche individuelle créée: $batchNumber pour {$employee->name}");
            }

            // Mettre à jour le solde de l'employé en MySQL
            $amountToAdd = $ticketsCount * $ticketValue;
            $employee->increment('ticket_balance', $amountToAdd);

            // Créer l'affectation en MySQL (historique)
            $assignment = \App\Models\UserTicket::create([
                'id' => 'assign_' . time() . '_' . rand(1000, 9999),
                'employee_id' => $employeeId,
                'employee_name' => $employee->name,
                'batch_id' => $createdBatchId,
                'tickets_count' => $ticketsCount,
                'ticket_value' => $ticketValue,
                'type' => $batchId ? 'batch' : 'manual',
                'assigned_by' => $request->header('X-User-Name', 'Système'),
                'notes' => $notes
            ]);

            Log::info('Tickets affectés avec succès');

            // Rafraîchir l'employé
            $employee->refresh();

            // Créer une notification
            $employeeName = $employee->name;
            $newBalance = $employee->ticket_balance;
            NotificationController::createNotification([
                'type' => 'success',
                'title' => 'Nouveaux tickets reçus !',
                'message' => "Vous avez reçu $ticketsCount ticket(s) d'une valeur de {$ticketValue}F chacun. Solde total: {$newBalance}F.",
                'user_id' => $employeeId,
                'action_url' => '/employee/tickets',
                'metadata' => [
                    'tickets_count' => $ticketsCount,
                    'ticket_value' => $ticketValue,
                    'assignment_id' => $assignment['id']
                ]
            ]);

            // Envoyer email d'affectation de tickets à l'employé
            try {
                Mail::to($employee->email)->send(new TicketsAssigned(
                    $employeeName,
                    $ticketsCount,
                    $ticketValue,
                    $amountToAdd
                ));
                Log::info("Email d'affectation de tickets envoyé à: {$employee->email}");
            } catch (\Exception $e) {
                Log::error("Erreur envoi email affectation tickets: " . $e->getMessage());
            }

            // Envoyer notification WhatsApp à l'employé
            if (env('WHATSAPP_ENABLED', false) && !empty($employee->phone)) {
                try {
                    $whatsappService = new \App\Services\WhatsAppService();

                    // Préparer les infos pour WhatsApp
                    $batchNumber = 'Affectation manuelle';
                    $validityStartFormatted = 'N/A';
                    $validityEndFormatted = 'N/A';

                    if ($batchId) {
                        $batchNumber = substr($batchId, -8);
                    }

                    if ($validityStart && $validityEnd) {
                        $validityStartFormatted = date('d/m/Y', strtotime($validityStart));
                        $validityEndFormatted = date('d/m/Y', strtotime($validityEnd));
                    }

                    // Préparer les données pour le template
                    $whatsappData = [
                        'employee_name' => $employeeName,
                        'tickets_count' => $ticketsCount,
                        'ticket_value' => number_format((float)$ticketValue, 0, '', ' '),
                        'batch_number' => $batchNumber,
                        'validity_start' => $validityStartFormatted,
                        'validity_end' => $validityEndFormatted,
                        'new_balance' => number_format((float)$newBalance, 0, '', ' ')
                    ];

                    $whatsappService->sendTemplate(
                        $employee->phone,
                        'tickets_assigned',
                        $whatsappData
                    );

                    Log::info("Notification WhatsApp d'affectation tickets envoyée à: {$employee->phone}");
                } catch (\Exception $e) {
                    Log::error("Erreur envoi WhatsApp affectation tickets: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'data' => $employee->toArray(),
                'message' => 'Tickets affectés avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('UserTicketController@assignTickets - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'affectation des tickets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Recharge employee balance.
     */
    public function rechargeBalance(Request $request, string $employeeId): JsonResponse
    {
        try {
            Log::info('UserTicketController@rechargeBalance - Employee ID: ' . $employeeId);
            Log::info('Données reçues:', $request->all());

            // Validation
            $request->validate([
                'amount' => 'required|numeric|min:1',
                'notes' => 'nullable|string'
            ]);

            $amount = $request->input('amount');
            $notes = $request->input('notes', '');

            // Trouver l'employé en MySQL
            $employee = \App\Models\Employee::find($employeeId);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Créer une souche pour le rechargement
            $companyId = $employee->company_id;
            preg_match_all('/\d+/', $companyId, $matches);
            $companyCode = !empty($matches[0]) ? 'E' . implode('', $matches[0]) : 'E000';
            $batchCounter = \App\Models\TicketBatch::where('company_id', $companyId)->count() + 1;
            $timestamp = time();

            $batchNumber = 'SOUCHE-' . $companyCode . '-' . date('Ymd') . '-' . str_pad($batchCounter, 4, '0', STR_PAD_LEFT);
            $createdBatchId = 'batch_' . $timestamp . '_' . $batchCounter;

            $validityStart = date('Y-m-d');
            $validityEnd = date('Y-m-d', strtotime('+30 days'));

            // Déterminer la valeur unitaire et le nombre de tickets
            // Le rechargement crée des tickets de la valeur du montant
            $ticketValue = $amount;
            $ticketsCount = 1;

            $tickets = [[
                'ticket_number' => $batchNumber . '-T001',
                'value' => $ticketValue,
                'status' => 'available',
                'used_at' => null
            ]];

            $userName = $request->header('X-User-Name', 'Système');

            \App\Models\TicketBatch::create([
                'id' => $createdBatchId,
                'batch_number' => $batchNumber,
                'company_id' => $companyId,
                'config_id' => null,
                'employee_id' => $employeeId,
                'employee_name' => $employee->name,
                'created_by' => $userName,
                'total_tickets' => $ticketsCount,
                'ticket_value' => $ticketValue,
                'type' => 'standard',
                'validity_start' => $validityStart,
                'validity_end' => $validityEnd,
                'assigned_tickets' => $ticketsCount,
                'used_tickets' => 0,
                'remaining_tickets' => $ticketsCount,
                'status' => 'active',
                'tickets' => $tickets
            ]);

            Log::info("Souche rechargement créée: $batchNumber pour {$employee->name}");

            // Mettre à jour le solde en MySQL
            $employee->increment('ticket_balance', $amount);

            // Enregistrer dans l'historique MySQL
            $assignment = \App\Models\UserTicket::create([
                'id' => 'recharge_' . time() . '_' . rand(1000, 9999),
                'employee_id' => $employeeId,
                'employee_name' => $employee->name,
                'batch_id' => $createdBatchId,
                'tickets_count' => $ticketsCount,
                'ticket_value' => $ticketValue,
                'type' => 'manual',
                'assigned_by' => $userName,
                'notes' => $notes ? "Rechargement: $notes" : 'Rechargement manuel'
            ]);

            Log::info('Solde rechargé avec succès');

            // Rafraîchir l'employé
            $employee->refresh();

            return response()->json([
                'success' => true,
                'data' => $employee->toArray(),
                'message' => 'Solde rechargé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('UserTicketController@rechargeBalance - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rechargement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk assign tickets to all active employees by generating individual batches.
     */
    public function bulkAssignTickets(Request $request): JsonResponse
    {
        try {
            Log::info('UserTicketController@bulkAssignTickets - Début');
            Log::info('Données reçues:', $request->all());

            // Validation
            $request->validate([
                'tickets_count' => 'required|integer|min:1',
                'ticket_value' => 'required|integer|min:100',
                'config_id' => 'required|string',
                'notes' => 'nullable|string'
            ]);

            $ticketsCount = $request->input('tickets_count');
            $ticketValue = $request->input('ticket_value');
            $configId = $request->input('config_id');
            $notes = $request->input('notes', '');
            $userCompanyId = $request->header('X-User-Company-Id');
            // Récupérer le nom d'utilisateur depuis le header, le body ou le localStorage
            $userName = $request->header('X-User-Name')
                     ?? $request->input('created_by')
                     ?? 'Système';

            // Charger la configuration depuis MySQL
            $config = \App\Models\TicketConfiguration::find($configId);
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuration de tickets non trouvée'
                ], 404);
            }

            // Charger les employés actifs depuis MySQL
            $query = \App\Models\Employee::where('status', 'active');
            if ($userCompanyId) {
                $query->where('company_id', $userCompanyId);
            }
            $activeEmployees = $query->get();

            if ($activeEmployees->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun employé actif trouvé'
                ], 404);
            }

            // Générer un code entreprise
            preg_match_all('/\d+/', $userCompanyId, $matches);
            $companyCode = !empty($matches[0]) ? 'E' . implode('', $matches[0]) : 'E000';

            // Compter les souches existantes de cette entreprise
            $batchCounter = \App\Models\TicketBatch::where('company_id', $userCompanyId)->count() + 1;
            $timestamp = time();

            $createdBatches = [];
            $successCount = 0;

            // Calculer les dates de validité
            $validityStart = date('Y-m-d');
            $validityEnd = date('Y-m-d', strtotime("+{$config->validity_days} days"));

            // Créer une souche pour chaque employé actif
            foreach ($activeEmployees as $employee) {
                    // Générer un numéro de souche unique avec format: SOUCHE-[CODE_ENTREPRISE]-YYYYMMDD-XXXX
                    $batchNumber = 'SOUCHE-' . $companyCode . '-' . date('Ymd') . '-' . str_pad($batchCounter, 4, '0', STR_PAD_LEFT);
                    $batchId = 'batch_' . $timestamp . '_' . $batchCounter;

                    // Générer les tickets individuels
                    $tickets = [];
                    for ($i = 1; $i <= $ticketsCount; $i++) {
                        $ticketNumber = $batchNumber . '-T' . str_pad($i, 3, '0', STR_PAD_LEFT);
                        $tickets[] = [
                            'ticket_number' => $ticketNumber,
                            'value' => $ticketValue,
                            'status' => 'available',
                            'used_at' => null
                        ];
                    }

                    // Créer la souche en MySQL
                    $batch = \App\Models\TicketBatch::create([
                        'id' => $batchId,
                        'batch_number' => $batchNumber,
                        'company_id' => $userCompanyId,
                        'config_id' => $configId,
                        'employee_id' => $employee->id,
                        'employee_name' => $employee->name,
                        'created_by' => $userName,
                        'total_tickets' => $ticketsCount,
                        'ticket_value' => $ticketValue,
                        'type' => 'standard', // Type par défaut
                        'validity_start' => $validityStart,
                        'validity_end' => $validityEnd,
                        'assigned_tickets' => $ticketsCount,
                        'used_tickets' => 0,
                        'remaining_tickets' => $ticketsCount,
                        'status' => 'active',
                        'tickets' => $tickets
                    ]);

                    $createdBatches[] = $batch->toArray();

                    // Mettre à jour le solde de l'employé en MySQL
                    $amountToAdd = $ticketsCount * $ticketValue;
                    $employee->increment('ticket_balance', $amountToAdd);

                    // Enregistrer l'affectation en MySQL
                    $assignment = \App\Models\UserTicket::create([
                        'id' => 'assign_' . $timestamp . '_' . $batchCounter,
                        'employee_id' => $employee->id,
                        'employee_name' => $employee->name,
                        'batch_id' => $batchId,
                        'tickets_count' => $ticketsCount,
                        'ticket_value' => $ticketValue,
                        'type' => 'batch',
                        'assigned_by' => $userName,
                        'notes' => $notes ? "Affectation groupée: $notes" : "Affectation groupée - Souche $batchNumber"
                    ]);

                    // Créer une notification pour cet employé
                    NotificationController::createNotification([
                        'type' => 'success',
                        'title' => 'Tickets distribués !',
                        'message' => "Distribution mensuelle : Vous avez reçu $ticketsCount ticket(s) de {$ticketValue}F. Bon appétit !",
                        'user_id' => $employee->id,
                        'action_url' => '/employee/tickets',
                        'metadata' => [
                            'batch_number' => $batchNumber,
                            'tickets_count' => $ticketsCount,
                            'ticket_value' => $ticketValue,
                            'assignment_id' => $assignment->id
                        ]
                    ]);

                    // Envoyer notification WhatsApp
                    if (env('WHATSAPP_ENABLED', false) && !empty($employee->phone)) {
                        try {
                            $whatsappService = new \App\Services\WhatsAppService();
                            $employee->refresh(); // Rafraîchir pour avoir le nouveau solde

                            $whatsappData = [
                                'employee_name' => $employee->name,
                                'tickets_count' => $ticketsCount,
                                'ticket_value' => number_format($ticketValue, 0, '', ' '),
                                'batch_number' => $batchNumber,
                                'validity_start' => date('d/m/Y', strtotime($validityStart)),
                                'validity_end' => date('d/m/Y', strtotime($validityEnd)),
                                'new_balance' => number_format($employee->ticket_balance, 0, '', ' ')
                            ];

                            $whatsappService->sendTemplate($employee->phone, 'tickets_assigned', $whatsappData);
                            Log::info("WhatsApp affectation groupée envoyée à: {$employee->phone}");
                        } catch (\Exception $e) {
                            Log::error("Erreur WhatsApp pour {$employee->name}: " . $e->getMessage());
                        }
                    }

                    $successCount++;
                    $batchCounter++;
            }

            Log::info("Affectation groupée réussie: $successCount souches créées");

            return response()->json([
                'success' => true,
                'data' => [
                    'success' => $successCount,
                    'total' => $activeEmployees->count(),
                    'batches' => $createdBatches
                ],
                'message' => "$successCount souche(s) créée(s) et affectée(s) avec succès"
            ]);

        } catch (\Exception $e) {
            Log::error('UserTicketController@bulkAssignTickets - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'affectation groupée',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get ticket assignments history.
     */
    public function getAssignments(Request $request): JsonResponse
    {
        try {
            $employeeId = $request->query('employee_id');

            // Charger depuis MySQL
            $query = \App\Models\UserTicket::query();

            // Filtrer par employé si spécifié
            if ($employeeId) {
                $query->where('employee_id', $employeeId);
            }

            // Filtrage par rôle et entreprise
            $userRole = $request->header('X-User-Role');
            $userCompanyId = $request->header('X-User-Company-Id');

            if ($userRole === 'Gestionnaire Entreprise' && $userCompanyId) {
                // Filtrer par employés de l'entreprise
                $companyEmployeeIds = \App\Models\Employee::where('company_id', $userCompanyId)->pluck('id')->toArray();
                $query->whereIn('employee_id', $companyEmployeeIds);
            }

            $assignments = $query->orderBy('created_at', 'desc')->get()->toArray();

            return response()->json([
                'success' => true,
                'data' => $assignments
            ]);

        } catch (\Exception $e) {
            Log::error('UserTicketController@getAssignments - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'historique',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
