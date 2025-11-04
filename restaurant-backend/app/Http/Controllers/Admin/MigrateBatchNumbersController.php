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
            Log::info('MigrateBatchNumbersController@migrate - Début migration depuis MySQL');
            
            // Charger toutes les souches depuis MySQL
            $batches = \App\Models\TicketBatch::all();
            
            if ($batches->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Aucune souche à migrer',
                    'migrated' => 0
                ]);
            }
            
            // Grouper les souches par entreprise
            $batchesByCompany = [];
            foreach ($batches as $batch) {
                $companyId = $batch->company_id ?? 'unknown';
                if (!isset($batchesByCompany[$companyId])) {
                    $batchesByCompany[$companyId] = [];
                }
                $batchesByCompany[$companyId][] = $batch;
            }
            
            $migratedCount = 0;
            
            // Traiter chaque entreprise séparément
            foreach ($batchesByCompany as $companyId => $companyBatchList) {
                // Générer le code entreprise
                if ($companyId === 'unknown' || empty($companyId) || $companyId === 'null') {
                    $companyCode = 'E000';
                } else {
                    preg_match_all('/\d+/', $companyId, $matches);
                    $companyCode = !empty($matches[0]) ? 'E' . implode('', $matches[0]) : 'E000';
                }
                
                // Trier par date de création
                usort($companyBatchList, function($a, $b) {
                    return strtotime($a->created_at) - strtotime($b->created_at);
                });
                
                $counter = 1;
                
                foreach ($companyBatchList as $batch) {
                    // Si la souche n'a pas de batch_number OU ancien format "BATCH-"
                    $needsMigration = empty($batch->batch_number) || 
                                     strpos($batch->batch_number, 'BATCH-') === 0;
                    
                    if ($needsMigration) {
                        // Nouveau format
                        $createdDate = date('Ymd', strtotime($batch->created_at));
                        $newBatchNumber = 'SOUCHE-' . $companyCode . '-' . $createdDate . '-' . str_pad($counter, 4, '0', STR_PAD_LEFT);
                        
                        // Mettre à jour les tickets
                        $tickets = $batch->tickets ?? [];
                        if (is_array($tickets) && !empty($tickets)) {
                            foreach ($tickets as &$ticket) {
                                if (isset($ticket['ticket_number'])) {
                                    preg_match('/-T(\d+)$/', $ticket['ticket_number'], $ticketMatches);
                                    if (!empty($ticketMatches[1])) {
                                        $ticket['ticket_number'] = $newBatchNumber . '-T' . $ticketMatches[1];
                                    }
                                }
                            }
                        } else {
                            // Générer les tickets
                            $tickets = [];
                            for ($i = 1; $i <= $batch->total_tickets; $i++) {
                                $tickets[] = [
                                    'ticket_number' => $newBatchNumber . '-T' . str_pad($i, 3, '0', STR_PAD_LEFT),
                                    'value' => $batch->ticket_value,
                                    'status' => $i <= $batch->used_tickets ? 'used' : 'available',
                                    'used_at' => $i <= $batch->used_tickets ? $batch->updated_at : null
                                ];
                            }
                        }
                        
                        // Mettre à jour en MySQL
                        $batch->update([
                            'batch_number' => $newBatchNumber,
                            'tickets' => $tickets
                        ]);
                        
                        $migratedCount++;
                        Log::info("Souche migrée: {$batch->id} -> {$newBatchNumber}");
                    }
                    
                    $counter++;
                }
            }
            
            Log::info("Migration terminée: $migratedCount souche(s) migrée(s)");
            
            return response()->json([
                'success' => true,
                'message' => "Migration réussie: $migratedCount souche(s) migrée(s)",
                'migrated' => $migratedCount,
                'total' => $batches->count()
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
