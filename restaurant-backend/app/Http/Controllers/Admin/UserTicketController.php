<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

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
                'notes' => 'nullable|string'
            ]);

            $ticketsCount = $request->input('tickets_count');
            $batchId = $request->input('batch_id');
            $notes = $request->input('notes', '');

            // Charger les employés
            $employeesFile = storage_path('app/employees.json');
            $employees = json_decode(file_get_contents($employeesFile), true) ?? [];

            // Trouver l'employé
            $employeeIndex = collect($employees)->search(function ($emp) use ($employeeId) {
                return $emp['id'] === $employeeId;
            });

            if ($employeeIndex === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            $ticketValue = 500; // Valeur par défaut

            // Si une souche est spécifiée, vérifier et déduire
            if ($batchId) {
                $batchesFile = storage_path('app/ticket_batches.json');
                if (file_exists($batchesFile)) {
                    $batches = json_decode(file_get_contents($batchesFile), true) ?? [];
                    
                    $batchIndex = collect($batches)->search(function ($batch) use ($batchId) {
                        return $batch['id'] === $batchId;
                    });

                    if ($batchIndex !== false) {
                        $batch = &$batches[$batchIndex];
                        
                        // Note: Avec la nouvelle logique, assigned_tickets = total_tickets dès la création
                        // remaining_tickets diminue lors de la consommation, pas lors de l'affectation
                        // On garde juste la référence à la souche pour le tracking

                        $ticketValue = $batch['ticket_value'];

                        // Sauvegarder la souche mise à jour
                        file_put_contents($batchesFile, json_encode($batches, JSON_PRETTY_PRINT));
                    }
                }
            }

            // Mettre à jour le solde de l'employé
            $amountToAdd = $ticketsCount * $ticketValue;
            $employees[$employeeIndex]['ticket_balance'] += $amountToAdd;
            $employees[$employeeIndex]['updated_at'] = date('Y-m-d H:i:s');

            // Sauvegarder les employés
            file_put_contents($employeesFile, json_encode($employees, JSON_PRETTY_PRINT));

            // Enregistrer l'affectation dans l'historique
            $assignmentsFile = storage_path('app/ticket_assignments.json');
            $assignments = [];
            if (file_exists($assignmentsFile)) {
                $assignments = json_decode(file_get_contents($assignmentsFile), true) ?? [];
            }

            $assignment = [
                'id' => 'assign_' . time() . '_' . rand(1000, 9999),
                'employee_id' => $employeeId,
                'employee_name' => $employees[$employeeIndex]['name'],
                'batch_id' => $batchId,
                'tickets_count' => $ticketsCount,
                'ticket_value' => $ticketValue,
                'type' => $batchId ? 'batch' : 'manual',
                'assigned_by' => $request->header('X-User-Name', 'Système'),
                'notes' => $notes,
                'created_at' => date('Y-m-d H:i:s')
            ];

            $assignments[] = $assignment;
            file_put_contents($assignmentsFile, json_encode($assignments, JSON_PRETTY_PRINT));

            Log::info('Tickets affectés avec succès');

            return response()->json([
                'success' => true,
                'data' => $employees[$employeeIndex],
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

            // Charger les employés
            $employeesFile = storage_path('app/employees.json');
            $employees = json_decode(file_get_contents($employeesFile), true) ?? [];

            // Trouver l'employé
            $employeeIndex = collect($employees)->search(function ($emp) use ($employeeId) {
                return $emp['id'] === $employeeId;
            });

            if ($employeeIndex === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Mettre à jour le solde
            $employees[$employeeIndex]['ticket_balance'] += $amount;
            $employees[$employeeIndex]['updated_at'] = date('Y-m-d H:i:s');

            // Sauvegarder
            file_put_contents($employeesFile, json_encode($employees, JSON_PRETTY_PRINT));

            // Enregistrer dans l'historique
            $assignmentsFile = storage_path('app/ticket_assignments.json');
            $assignments = [];
            if (file_exists($assignmentsFile)) {
                $assignments = json_decode(file_get_contents($assignmentsFile), true) ?? [];
            }

            $assignment = [
                'id' => 'recharge_' . time() . '_' . rand(1000, 9999),
                'employee_id' => $employeeId,
                'employee_name' => $employees[$employeeIndex]['name'],
                'batch_id' => null,
                'tickets_count' => 1,
                'ticket_value' => $amount,
                'type' => 'manual',
                'assigned_by' => $request->header('X-User-Name', 'Système'),
                'notes' => $notes ? "Rechargement: $notes" : 'Rechargement manuel',
                'created_at' => date('Y-m-d H:i:s')
            ];

            $assignments[] = $assignment;
            file_put_contents($assignmentsFile, json_encode($assignments, JSON_PRETTY_PRINT));

            Log::info('Solde rechargé avec succès');

            return response()->json([
                'success' => true,
                'data' => $employees[$employeeIndex],
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

            // Charger la configuration pour obtenir les paramètres
            $configsFile = storage_path('app/ticket_configurations.json');
            $configs = json_decode(file_get_contents($configsFile), true) ?? [];
            
            $config = collect($configs)->firstWhere('id', $configId);
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuration de tickets non trouvée'
                ], 404);
            }

            // Charger les employés
            $employeesFile = storage_path('app/employees.json');
            $employees = json_decode(file_get_contents($employeesFile), true) ?? [];

            // Filtrer les employés actifs de l'entreprise du gestionnaire
            $activeEmployees = array_filter($employees, function($emp) use ($userCompanyId) {
                return $emp['status'] === 'active' && 
                       (!$userCompanyId || (isset($emp['company_id']) && $emp['company_id'] === $userCompanyId));
            });

            if (empty($activeEmployees)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun employé actif trouvé'
                ], 404);
            }

            // Charger les souches existantes
            $batchesFile = storage_path('app/ticket_batches.json');
            $batches = [];
            if (file_exists($batchesFile)) {
                $batches = json_decode(file_get_contents($batchesFile), true) ?? [];
            }

            // Charger les affectations existantes
            $assignmentsFile = storage_path('app/ticket_assignments.json');
            $assignments = [];
            if (file_exists($assignmentsFile)) {
                $assignments = json_decode(file_get_contents($assignmentsFile), true) ?? [];
            }

            // Générer un code entreprise unique à partir du company_id
            // Extraire les chiffres du company_id pour créer un code court
            preg_match_all('/\d+/', $userCompanyId, $matches);
            $companyCode = !empty($matches[0]) ? 'E' . implode('', $matches[0]) : 'E000';
            
            // Compter les souches de cette entreprise seulement
            $companyBatches = array_filter($batches, function($b) use ($userCompanyId) {
                return isset($b['company_id']) && $b['company_id'] === $userCompanyId;
            });
            $batchCounter = count($companyBatches) + 1;
            $timestamp = time();
            
            $createdBatches = [];
            $updatedEmployees = [];
            $successCount = 0;

            // Calculer les dates de validité
            $validityStart = date('Y-m-d');
            $validityEnd = date('Y-m-d', strtotime("+{$config['validity_duration_days']} days"));

            // Créer une souche pour chaque employé actif
            foreach ($employees as &$employee) {
                // Vérifier si c'est un employé actif de la liste
                $isActiveEmployee = false;
                foreach ($activeEmployees as $activeEmp) {
                    if ($activeEmp['id'] === $employee['id']) {
                        $isActiveEmployee = true;
                        break;
                    }
                }

                if ($isActiveEmployee) {
                    // Générer un numéro de souche unique avec format: SOUCHE-[CODE_ENTREPRISE]-YYYYMMDD-XXXX
                    $batchNumber = 'SOUCHE-' . $companyCode . '-' . date('Ymd') . '-' . str_pad($batchCounter, 4, '0', STR_PAD_LEFT);
                    $batchId = 'batch_' . $timestamp . '_' . $batchCounter;
                    
                    // Créer la souche individuelle pour cet employé
                    $batch = [
                        'id' => $batchId,
                        'batch_number' => $batchNumber,
                        'company_id' => $userCompanyId,
                        'config_id' => $configId,
                        'employee_id' => $employee['id'],
                        'employee_name' => $employee['name'],
                        'created_by' => $userName,
                        'total_tickets' => $ticketsCount,
                        'ticket_value' => $ticketValue,
                        'type' => $config['type'],
                        'validity_start' => $validityStart,
                        'validity_end' => $validityEnd,
                        'assigned_tickets' => $ticketsCount, // Tous les tickets assignés dès la création
                        'used_tickets' => 0, // Aucun ticket consommé pour l'instant
                        'remaining_tickets' => $ticketsCount, // Disponibles = diminuera lors de la consommation
                        'status' => 'active',
                        'tickets' => [],
                        'created_at' => date('Y-m-d H:i:s'),
                        'updated_at' => date('Y-m-d H:i:s')
                    ];

                    // Générer les tickets individuels avec numéros de suivi
                    for ($i = 1; $i <= $ticketsCount; $i++) {
                        $ticketNumber = $batchNumber . '-T' . str_pad($i, 3, '0', STR_PAD_LEFT);
                        $batch['tickets'][] = [
                            'ticket_number' => $ticketNumber,
                            'value' => $ticketValue,
                            'status' => 'available',
                            'used_at' => null
                        ];
                    }

                    $batches[] = $batch;
                    $createdBatches[] = $batch;

                    // Mettre à jour le solde de l'employé
                    $amountToAdd = $ticketsCount * $ticketValue;
                    $employee['ticket_balance'] += $amountToAdd;
                    $employee['updated_at'] = date('Y-m-d H:i:s');

                    // Enregistrer l'affectation
                    $assignment = [
                        'id' => 'assign_' . $timestamp . '_' . $batchCounter,
                        'employee_id' => $employee['id'],
                        'employee_name' => $employee['name'],
                        'batch_id' => $batchId,
                        'batch_number' => $batchNumber,
                        'tickets_count' => $ticketsCount,
                        'ticket_value' => $ticketValue,
                        'type' => 'batch',
                        'assigned_by' => $userName,
                        'notes' => $notes ? "Affectation groupée: $notes" : "Affectation groupée - Souche $batchNumber",
                        'created_at' => date('Y-m-d H:i:s')
                    ];
                    $assignments[] = $assignment;

                    $updatedEmployees[] = $employee;
                    $successCount++;
                    $batchCounter++;
                }
            }

            // Sauvegarder les souches
            file_put_contents($batchesFile, json_encode($batches, JSON_PRETTY_PRINT));

            // Sauvegarder les employés
            file_put_contents($employeesFile, json_encode($employees, JSON_PRETTY_PRINT));

            // Sauvegarder les affectations
            file_put_contents($assignmentsFile, json_encode($assignments, JSON_PRETTY_PRINT));

            Log::info("Affectation groupée réussie: $successCount souches créées pour $successCount employés");

            return response()->json([
                'success' => true,
                'data' => [
                    'success' => $successCount,
                    'total' => count($activeEmployees),
                    'employees' => $updatedEmployees,
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
            
            $assignmentsFile = storage_path('app/ticket_assignments.json');
            $assignments = [];
            
            if (file_exists($assignmentsFile)) {
                $assignments = json_decode(file_get_contents($assignmentsFile), true) ?? [];
            }

            // Nettoyer les affectations orphelines (dont le batch_id n'existe plus)
            $batchesFile = storage_path('app/ticket_batches.json');
            if (file_exists($batchesFile)) {
                $batches = json_decode(file_get_contents($batchesFile), true) ?? [];
                $validBatchIds = array_column($batches, 'id');
                
                $assignmentsCountBefore = count($assignments);
                
                // Garder seulement les affectations avec batch_id valide OU sans batch_id (manuelles)
                $assignments = array_filter($assignments, function($assignment) use ($validBatchIds) {
                    // Si pas de batch_id (affectation manuelle), on garde
                    if (!isset($assignment['batch_id']) || empty($assignment['batch_id'])) {
                        return true;
                    }
                    // Sinon, on vérifie que le batch_id existe toujours
                    return in_array($assignment['batch_id'], $validBatchIds);
                });
                
                $assignmentsCountAfter = count($assignments);
                $orphansDeleted = $assignmentsCountBefore - $assignmentsCountAfter;
                
                // Si des orphelins ont été supprimés, sauvegarder
                if ($orphansDeleted > 0) {
                    file_put_contents($assignmentsFile, json_encode(array_values($assignments), JSON_PRETTY_PRINT));
                    Log::info("Nettoyage automatique: {$orphansDeleted} affectation(s) orpheline(s) supprimée(s)");
                }
            }

            // Filtrer par employé si spécifié
            if ($employeeId) {
                $assignments = array_filter($assignments, function($assignment) use ($employeeId) {
                    return $assignment['employee_id'] === $employeeId;
                });
            }

            // Filtrage par rôle et entreprise
            $userRole = $request->header('X-User-Role');
            $userCompanyId = $request->header('X-User-Company-Id');
            
            if ($userRole === 'Gestionnaire Entreprise' && $userCompanyId) {
                // Charger les employés pour filtrer par entreprise
                $employeesFile = storage_path('app/employees.json');
                if (file_exists($employeesFile)) {
                    $employees = json_decode(file_get_contents($employeesFile), true) ?? [];
                    $companyEmployeeIds = array_column(
                        array_filter($employees, function($emp) use ($userCompanyId) {
                            return isset($emp['company_id']) && $emp['company_id'] === $userCompanyId;
                        }),
                        'id'
                    );
                    
                    $assignments = array_filter($assignments, function($assignment) use ($companyEmployeeIds) {
                        return in_array($assignment['employee_id'], $companyEmployeeIds);
                    });
                }
            }

            return response()->json([
                'success' => true,
                'data' => array_values($assignments)
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
