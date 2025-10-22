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
            // Stockage persistant en fichier
            $filePath = storage_path('app/ticket_batches.json');
            
            if (file_exists($filePath)) {
                $batches = json_decode(file_get_contents($filePath), true) ?? [];
            } else {
                $batches = [];
            }

            // Filtrage par rôle
            $userRole = $request->header('X-User-Role');
            $userCompanyId = $request->header('X-User-Company-Id');
            
            Log::info('TicketBatchController@index - Rôle: ' . $userRole . ', Company ID: ' . $userCompanyId);
            
            // Si c'est un gestionnaire d'entreprise, filtrer par son entreprise uniquement
            if ($userRole === 'Gestionnaire Entreprise' && $userCompanyId) {
                $batches = array_filter($batches, function($batch) use ($userCompanyId) {
                    return isset($batch['company_id']) && $batch['company_id'] === $userCompanyId;
                });
                Log::info('Souches filtrées pour gestionnaire: ' . count($batches));
            }
            // Si c'est un administrateur, il voit TOUTES les souches (pas de filtre)
            
            // Mettre à jour le statut des souches (actif/expiré)
            $currentDate = date('Y-m-d');
            foreach ($batches as &$batch) {
                if ($batch['remaining_tickets'] <= 0 && $batch['status'] !== 'depleted') {
                    $batch['status'] = 'depleted';
                } elseif ($currentDate > $batch['validity_end'] && $batch['status'] !== 'expired') {
                    $batch['status'] = 'expired';
                } elseif ($batch['status'] !== 'active' && $currentDate <= $batch['validity_end'] && $batch['remaining_tickets'] > 0) {
                    $batch['status'] = 'active';
                }
            }
            
            // Sauvegarder les mises à jour de statut
            if (count($batches) > 0) {
                file_put_contents($filePath, json_encode(array_values($batches), JSON_PRETTY_PRINT));
            }
            
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

            // Charger les souches existantes
            $filePath = storage_path('app/ticket_batches.json');
            $batches = [];
            
            if (file_exists($filePath)) {
                $batches = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Générer un code entreprise unique à partir du company_id
            // Extraire les chiffres du company_id pour créer un code court
            preg_match_all('/\d+/', $companyId, $matches);
            $companyCode = !empty($matches[0]) ? 'E' . implode('', $matches[0]) : 'E000';
            
            // Compter les souches de cette entreprise seulement
            $companyBatches = array_filter($batches, function($b) use ($companyId) {
                return isset($b['company_id']) && $b['company_id'] === $companyId;
            });
            $batchCounter = count($companyBatches) + 1;
            $timestamp = time();
            
            // Générer un numéro de souche unique avec format: SOUCHE-[CODE_ENTREPRISE]-YYYYMMDD-XXXX
            $batchNumber = 'SOUCHE-' . $companyCode . '-' . date('Ymd') . '-' . str_pad($batchCounter, 4, '0', STR_PAD_LEFT);

            // Créer la nouvelle souche
            $batchData = [
                'id' => 'batch_' . $timestamp . '_' . rand(1000, 9999),
                'batch_number' => $batchNumber,
                'company_id' => $companyId,
                'config_id' => $configId,
                'created_by' => $createdBy,
                'total_tickets' => (int) $totalTickets,
                'ticket_value' => (float) $ticketValue,
                'type' => $type,
                'validity_start' => $validityStart,
                'validity_end' => $validityEnd,
                'assigned_tickets' => (int) $totalTickets, // Tous les tickets sont assignés dès la création
                'used_tickets' => 0, // Aucun ticket consommé au départ
                'remaining_tickets' => (int) $totalTickets, // Disponibles = diminue lors de la consommation
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

            // Ajouter à la liste
            $batches[] = $batchData;

            // Sauvegarder dans le fichier
            file_put_contents($filePath, json_encode($batches, JSON_PRETTY_PRINT));

            Log::info('Souche de tickets créée:', $batchData);

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
            // Charger les souches depuis le fichier
            $filePath = storage_path('app/ticket_batches.json');
            $batches = [];
            
            if (file_exists($filePath)) {
                $batches = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Trouver la souche par ID
            $batch = collect($batches)->firstWhere('id', $id);

            if (!$batch) {
                return response()->json([
                    'success' => false,
                    'message' => 'Souche non trouvée'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $batch
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
            
            // Charger les souches depuis le fichier
            $filePath = storage_path('app/ticket_batches.json');
            $batches = [];
            
            if (file_exists($filePath)) {
                $batches = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Trouver la souche à supprimer pour récupérer les infos de l'employé
            $batchToDelete = collect($batches)->firstWhere('id', $id);

            if (!$batchToDelete) {
                return response()->json([
                    'success' => false,
                    'message' => 'Souche non trouvée'
                ], 404);
            }

            // Si la souche est liée à un employé, mettre à jour son solde
            if (isset($batchToDelete['employee_id'])) {
                $employeeId = $batchToDelete['employee_id'];
                $ticketsToRemove = $batchToDelete['remaining_tickets']; // Tickets non consommés
                $ticketValue = $batchToDelete['ticket_value'];
                $amountToRemove = $ticketsToRemove * $ticketValue;

                // Charger les employés
                $employeesFile = storage_path('app/employees.json');
                if (file_exists($employeesFile)) {
                    $employees = json_decode(file_get_contents($employeesFile), true) ?? [];
                    
                    // Trouver et mettre à jour l'employé
                    $employeeIndex = collect($employees)->search(function ($emp) use ($employeeId) {
                        return $emp['id'] === $employeeId;
                    });

                    if ($employeeIndex !== false) {
                        // Déduire le montant des tickets non consommés
                        $employees[$employeeIndex]['ticket_balance'] -= $amountToRemove;
                        $employees[$employeeIndex]['updated_at'] = date('Y-m-d H:i:s');
                        
                        // Sauvegarder les employés mis à jour
                        file_put_contents($employeesFile, json_encode($employees, JSON_PRETTY_PRINT));
                        
                        Log::info("Solde de l'employé {$employeeId} réduit de {$amountToRemove}F ({$ticketsToRemove} tickets non consommés)");
                    }
                }
            }

            // Filtrer pour supprimer la souche
            $batches = array_values(array_filter($batches, function ($batch) use ($id) {
                return $batch['id'] !== $id;
            }));

            // Sauvegarder dans le fichier
            file_put_contents($filePath, json_encode($batches, JSON_PRETTY_PRINT));

            Log::info('Souche supprimée avec succès: ' . $id);

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
            
            // Charger les souches depuis le fichier
            $filePath = storage_path('app/ticket_batches.json');
            $batches = [];
            
            if (file_exists($filePath)) {
                $batches = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Trouver l'index de la souche
            $batchIndex = collect($batches)->search(function ($batch) use ($id) {
                return $batch['id'] === $id;
            });

            if ($batchIndex === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Souche non trouvée'
                ], 404);
            }

            // Vérifier si des tickets sont disponibles
            if ($batches[$batchIndex]['remaining_tickets'] <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun ticket disponible dans cette souche'
                ], 400);
            }

            // Vérifier si la souche est expirée
            if ($batches[$batchIndex]['status'] === 'expired') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cette souche de tickets est expirée'
                ], 400);
            }

            // Utiliser un ticket
            $batches[$batchIndex]['used_tickets'] += 1;
            $batches[$batchIndex]['remaining_tickets'] -= 1;
            $batches[$batchIndex]['updated_at'] = date('Y-m-d H:i:s');

            // Mettre à jour le statut si épuisé
            if ($batches[$batchIndex]['remaining_tickets'] <= 0) {
                $batches[$batchIndex]['status'] = 'depleted';
            }

            // Sauvegarder dans le fichier
            file_put_contents($filePath, json_encode($batches, JSON_PRETTY_PRINT));

            Log::info('Ticket utilisé, souche mise à jour:', $batches[$batchIndex]);

            return response()->json([
                'success' => true,
                'data' => $batches[$batchIndex],
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
