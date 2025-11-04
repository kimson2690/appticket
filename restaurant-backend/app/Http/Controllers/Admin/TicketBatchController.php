<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TicketBatchController extends Controller
{
    /**
     * Display a listing of ticket batches.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Charger depuis MySQL
            $userRole = $request->header('X-User-Role');
            $userCompanyId = $request->header('X-User-Company-Id');
            
            Log::info('TicketBatchController@index - Rôle: ' . $userRole . ', Company ID: ' . $userCompanyId);
            
            // Query builder avec filtrage
            $query = \App\Models\TicketBatch::query();
            
            // Si gestionnaire d'entreprise, filtrer par entreprise
            if ($userRole === 'Gestionnaire Entreprise' && $userCompanyId) {
                $query->where('company_id', $userCompanyId);
                Log::info('Souches filtrées pour gestionnaire');
            }
            
            $batches = $query->get();
            
            // Mettre à jour le statut des souches (actif/expiré)
            $currentDate = date('Y-m-d');
            foreach ($batches as $batch) {
                $needsUpdate = false;
                $newStatus = $batch->status;
                
                if ($batch->remaining_tickets <= 0 && $batch->status !== 'depleted') {
                    $newStatus = 'depleted';
                    $needsUpdate = true;
                } elseif ($currentDate > $batch->validity_end && $batch->status !== 'expired') {
                    $newStatus = 'expired';
                    $needsUpdate = true;
                } elseif ($batch->status !== 'active' && $currentDate <= $batch->validity_end && $batch->remaining_tickets > 0) {
                    $newStatus = 'active';
                    $needsUpdate = true;
                }
                
                if ($needsUpdate) {
                    $batch->update(['status' => $newStatus]);
                }
            }
            
            // Recharger pour obtenir les statuts à jour
            $batches = $query->get()->toArray();
            
            return response()->json([
                'success' => true,
                'data' => array_values($batches)
            ]);
        } catch (\Exception $e) {
            Log::error('TicketBatchController@index - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des souches',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created ticket batch.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('TicketBatchController@store - Début');
            Log::info('Données reçues:', $request->all());
            
            // Validation des données
            $request->validate([
                'company_id' => 'required|string',
                'config_id' => 'required|string',
                'created_by' => 'required|string',
                'total_tickets' => 'required|integer|min:1|max:1000',
                'ticket_value' => 'required|numeric|min:0',
                'type' => 'required|in:standard,premium,bonus',
                'validity_start' => 'required|date',
                'validity_end' => 'required|date|after_or_equal:validity_start'
            ]);

            $companyId = $request->input('company_id');
            $configId = $request->input('config_id');
            $createdBy = $request->input('created_by');
            $totalTickets = $request->input('total_tickets');
            $ticketValue = $request->input('ticket_value');
            $type = $request->input('type');
            $validityStart = $request->input('validity_start');
            $validityEnd = $request->input('validity_end');

            // Charger les souches existantes depuis MySQL
            preg_match_all('/\d+/', $companyId, $matches);
            $companyCode = !empty($matches[0]) ? 'E' . implode('', $matches[0]) : 'E000';
            
            // Compter les souches de cette entreprise
            $batchCounter = \App\Models\TicketBatch::where('company_id', $companyId)->count() + 1;
            $timestamp = time();
            
            // Générer un numéro de souche unique avec format: SOUCHE-[CODE_ENTREPRISE]-YYYYMMDD-XXXX
            $batchNumber = 'SOUCHE-' . $companyCode . '-' . date('Ymd') . '-' . str_pad($batchCounter, 4, '0', STR_PAD_LEFT);

            // Créer la nouvelle souche
            $batchData = [
                'id' => 'batch_' . $timestamp . '_' . rand(1000, 9999),
                'batch_number' => $batchNumber,
                'company_id' => $companyId,
                'config_id' => $configId,
                'employee_id' => 'N/A', // N/A pour souche générale
                'employee_name' => 'Souche générale', // Nom pour souche générale
                'created_by' => $createdBy,
                'total_tickets' => (int) $totalTickets,
                'ticket_value' => (float) $ticketValue,
                'type' => $type,
                'validity_start' => $validityStart,
                'validity_end' => $validityEnd,
                'assigned_tickets' => 0, // Aucun ticket assigné au départ pour souche générale
                'used_tickets' => 0, // Aucun ticket consommé au départ
                'remaining_tickets' => (int) $totalTickets, // Disponibles = total au départ
                'status' => 'active',
                'tickets' => [],
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            // Générer les tickets individuels avec numéros de suivi
            for ($i = 1; $i <= $totalTickets; $i++) {
                $ticketNumber = $batchNumber . '-T' . str_pad($i, 3, '0', STR_PAD_LEFT);
                $batchData['tickets'][] = [
                    'ticket_number' => $ticketNumber,
                    'value' => (float) $ticketValue,
                    'status' => 'available',
                    'used_at' => null
                ];
            }

            // Créer en MySQL
            $batch = \App\Models\TicketBatch::create($batchData);

            Log::info('Souche de tickets créée:', $batch->toArray());

            // Créer une notification pour le gestionnaire
            $totalValue = $totalTickets * $ticketValue;
            NotificationController::createNotification([
                'type' => 'success',
                'title' => 'Souche créée avec succès',
                'message' => "Une nouvelle souche de {$totalTickets} tickets d'une valeur totale de {$totalValue}F a été créée ($batchNumber).",
                'role' => 'Gestionnaire Entreprise',
                'company_id' => $companyId,
                'action_url' => '/admin/ticket-batches',
                'metadata' => [
                    'batch_id' => $batchData['id'],
                    'batch_number' => $batchNumber,
                    'total_tickets' => $totalTickets,
                    'ticket_value' => $ticketValue,
                    'total_value' => $totalValue,
                    'type' => $type
                ]
            ]);

            return response()->json([
                'success' => true,
                'data' => $batchData,
                'message' => 'Souche de tickets créée avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('TicketBatchController@store - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la souche',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified ticket batch.
     */
    public function show(string $id): JsonResponse
    {
        try {
            // Trouver la souche en MySQL
            $batch = \App\Models\TicketBatch::find($id);

            if (!$batch) {
                return response()->json([
                    'success' => false,
                    'message' => 'Souche non trouvée'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $batch->toArray()
            ]);
            
        } catch (\Exception $e) {
            Log::error('TicketBatchController@show - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la souche',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified ticket batch.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            Log::info('TicketBatchController@destroy - Suppression ID: ' . $id);
            
            // Trouver la souche dans MySQL
            $batch = \App\Models\TicketBatch::find($id);

            if (!$batch) {
                return response()->json([
                    'success' => false,
                    'message' => 'Souche non trouvée'
                ], 404);
            }

            // Si la souche est liée à un employé, mettre à jour son solde
            if ($batch->employee_id) {
                $employee = \App\Models\Employee::find($batch->employee_id);
                if ($employee) {
                    $amountToRemove = $batch->remaining_tickets * $batch->ticket_value;
                    $employee->decrement('ticket_balance', $amountToRemove);
                    Log::info("Solde de l'employé {$batch->employee_id} réduit de {$amountToRemove}F");
                }
            }

            // Supprimer les affectations liées
            $deletedAssignments = \App\Models\UserTicket::where('batch_id', $id)->delete();
            
            // Supprimer la souche
            $batch->delete();

            Log::info("Souche {$id} supprimée avec {$deletedAssignments} affectation(s)");

            return response()->json([
                'success' => true,
                'message' => 'Souche supprimée avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('TicketBatchController@destroy - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la souche',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Use a ticket from a batch.
     */
    public function useTicket(string $id): JsonResponse
    {
        try {
            Log::info('TicketBatchController@useTicket - ID: ' . $id);
            
            // Trouver la souche en MySQL
            $batch = \App\Models\TicketBatch::find($id);

            if (!$batch) {
                return response()->json([
                    'success' => false,
                    'message' => 'Souche non trouvée'
                ], 404);
            }

            // Vérifier si des tickets sont disponibles
            if ($batch->remaining_tickets <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun ticket disponible dans cette souche'
                ], 400);
            }

            // Vérifier si la souche est expirée
            if ($batch->status === 'expired') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette souche de tickets est expirée'
                ], 400);
            }

            // Utiliser un ticket
            $batch->increment('used_tickets');
            $batch->decrement('remaining_tickets');

            // Mettre à jour le statut si épuisé
            if ($batch->remaining_tickets <= 0) {
                $batch->update(['status' => 'depleted']);
            }

            $batch->refresh();
            Log::info('Ticket utilisé, souche mise à jour:', $batch->toArray());

            return response()->json([
                'success' => true,
                'data' => $batch->toArray(),
                'message' => 'Ticket utilisé avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('TicketBatchController@useTicket - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'utilisation du ticket',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
