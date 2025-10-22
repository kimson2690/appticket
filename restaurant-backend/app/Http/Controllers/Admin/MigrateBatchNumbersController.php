<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MigrateBatchNumbersController extends Controller
{
    /**
     * Migrate existing batches to add batch_number with company code.
     */
    public function migrate(Request $request): JsonResponse
    {
        try {
            Log::info('MigrateBatchNumbersController@migrate - Début migration');
            
            $filePath = storage_path('app/ticket_batches.json');
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun fichier de souches trouvé'
                ], 404);
            }
            
            $batches = json_decode(file_get_contents($filePath), true) ?? [];
            
            if (empty($batches)) {
                return response()->json([
                    'success' => true,
                    'message' => 'Aucune souche à migrer',
                    'migrated' => 0
                ]);
            }
            
            // Grouper les souches par entreprise pour générer les compteurs
            $batchesByCompany = [];
            foreach ($batches as $batch) {
                $companyId = $batch['company_id'] ?? 'unknown';
                if (!isset($batchesByCompany[$companyId])) {
                    $batchesByCompany[$companyId] = [];
                }
                $batchesByCompany[$companyId][] = $batch;
            }
            
            $migratedCount = 0;
            $updatedBatches = [];
            
            // Traiter chaque entreprise séparément
            foreach ($batchesByCompany as $companyId => $companyBatchList) {
                // Générer le code entreprise
                if ($companyId === 'unknown' || empty($companyId) || $companyId === 'null') {
                    $companyCode = 'E000'; // Code par défaut pour les souches sans entreprise
                } else {
                    preg_match_all('/\d+/', $companyId, $matches);
                    $companyCode = !empty($matches[0]) ? 'E' . implode('', $matches[0]) : 'E000';
                }
                
                // Trier par date de création pour respecter l'ordre chronologique
                usort($companyBatchList, function($a, $b) {
                    return strtotime($a['created_at']) - strtotime($b['created_at']);
                });
                
                $counter = 1;
                
                foreach ($companyBatchList as $batch) {
                    // Si la souche n'a pas de batch_number OU si elle a l'ancien format "BATCH-", la migrer
                    $needsMigration = !isset($batch['batch_number']) || 
                                     empty($batch['batch_number']) || 
                                     strpos($batch['batch_number'], 'BATCH-') === 0;
                    
                    if ($needsMigration) {
                        // Utiliser la date de création de la souche
                        $createdDate = date('Ymd', strtotime($batch['created_at']));
                        $batch['batch_number'] = 'SOUCHE-' . $companyCode . '-' . $createdDate . '-' . str_pad($counter, 4, '0', STR_PAD_LEFT);
                        
                        // Mettre à jour les tickets si ils existent
                        if (isset($batch['tickets']) && is_array($batch['tickets'])) {
                            foreach ($batch['tickets'] as &$ticket) {
                                // Générer le numéro de ticket avec le nouveau format
                                if (isset($ticket['ticket_number'])) {
                                    // Extraire le numéro de ticket (ex: T001)
                                    preg_match('/-T(\d+)$/', $ticket['ticket_number'], $ticketMatches);
                                    if (!empty($ticketMatches[1])) {
                                        $ticket['ticket_number'] = $batch['batch_number'] . '-T' . $ticketMatches[1];
                                    }
                                }
                            }
                        } else {
                            // Si pas de tickets, en générer
                            $batch['tickets'] = [];
                            for ($i = 1; $i <= $batch['total_tickets']; $i++) {
                                $ticketNumber = $batch['batch_number'] . '-T' . str_pad($i, 3, '0', STR_PAD_LEFT);
                                $batch['tickets'][] = [
                                    'ticket_number' => $ticketNumber,
                                    'value' => $batch['ticket_value'],
                                    'status' => $i <= $batch['used_tickets'] ? 'used' : 'available',
                                    'used_at' => $i <= $batch['used_tickets'] ? $batch['updated_at'] : null
                                ];
                            }
                        }
                        
                        $batch['updated_at'] = date('Y-m-d H:i:s');
                        $migratedCount++;
                        
                        Log::info("Souche migrée: {$batch['id']} -> {$batch['batch_number']}");
                    }
                    
                    $updatedBatches[] = $batch;
                    $counter++;
                }
            }
            
            // Sauvegarder les souches mises à jour
            file_put_contents($filePath, json_encode($updatedBatches, JSON_PRETTY_PRINT));
            
            Log::info("Migration terminée: $migratedCount souche(s) migrée(s)");
            
            return response()->json([
                'success' => true,
                'message' => "Migration réussie: $migratedCount souche(s) migrée(s)",
                'migrated' => $migratedCount,
                'total' => count($updatedBatches)
            ]);
            
        } catch (\Exception $e) {
            Log::error('MigrateBatchNumbersController@migrate - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la migration',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
