<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class TicketConfigurationController extends Controller
{
    /**
     * Display a listing of ticket configurations.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Charger depuis MySQL
            $userRole = $request->header('X-User-Role');
            $userCompanyId = $request->header('X-User-Company-Id');
            $onlyActive = $request->query('active', false); // Paramètre pour filtrer uniquement les actives

            Log::info('====================================');
            Log::info('TicketConfigurationController@index - DÉBUT');
            Log::info('Rôle: ' . ($userRole ?? 'NULL'));
            Log::info('Company ID: ' . ($userCompanyId ?? 'NULL'));
            Log::info('Only Active: ' . ($onlyActive ?? 'NULL'));
            Log::info('Tous les headers:', $request->headers->all());

            $query = \App\Models\TicketConfiguration::query();

            // Si gestionnaire d'entreprise, filtrer par entreprise
            if ($userRole === 'Gestionnaire Entreprise' && $userCompanyId) {
                $query->where('company_id', $userCompanyId);
                Log::info('✅ Filtrage par company_id: ' . $userCompanyId);
            } else {
                Log::warning('⚠️ Pas de filtrage par entreprise - userRole: ' . ($userRole ?? 'NULL'));
            }

            // Filtrer uniquement les configurations actives si demandé
            if ($onlyActive === 'true' || $onlyActive === true || $onlyActive === '1') {
                $query->where('status', 'active');
                Log::info('✅ Filtrage uniquement des configurations actives');
            }

            $configurations = $query->orderBy('created_at', 'desc')->get();

            Log::info('📊 Nombre de configurations trouvées: ' . $configurations->count());

            if ($configurations->count() > 0) {
                foreach ($configurations as $config) {
                    Log::info('  → Config ID: ' . $config->id . ', Company: ' . $config->company_name . ', Status: ' . $config->status);
                }
            } else {
                Log::warning('⚠️ Aucune configuration trouvée!');
                Log::info('Total configurations en BDD: ' . \App\Models\TicketConfiguration::count());
            }

            Log::info('TicketConfigurationController@index - FIN');
            Log::info('====================================');

            return response()->json([
                'success' => true,
                'data' => array_values($configurations->toArray())
            ]);
        } catch (\Exception $e) {
            Log::error('❌ TicketConfigurationController@index - ERREUR: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des configurations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created ticket configuration.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('TicketConfigurationController@store - Début');
            Log::info('Données reçues:', $request->all());

            // Validation des données
            $request->validate([
                'ticket_value' => 'required|numeric|min:100',
                'validity_duration_days' => 'required|integer|min:1|max:365',
                'type' => 'nullable|in:standard,premium,bonus',
                'auto_renewal' => 'boolean',
                'logo' => 'nullable|string'
            ]);

            // Récupérer company_id
            $companyId = $request->input('company_id', $request->header('X-User-Company-Id', '1'));

            // Récupérer company_name depuis la base de données
            $company = \App\Models\Company::find($companyId);
            $companyName = $company ? $company->name : 'Non assigné';

            // Créer en MySQL avec mapping correct des colonnes
            $config = \App\Models\TicketConfiguration::create([
                'id' => 'config_' . time() . '_' . rand(1000, 9999),
                'company_id' => $companyId,
                'company_name' => $companyName,
                'ticket_value' => (float) $request->input('ticket_value'),
                'validity_days' => (int) $request->input('validity_duration_days'), // Mapping correct
                'monthly_allocation' => (int) $request->input('monthly_allocation', 0),
                'rollover_unused' => (bool) $request->input('rollover_unused', false),
                'max_order_amount' => $request->input('max_order_amount', null),
                'allowed_days' => $request->input('allowed_days', null),
                'start_time' => $request->input('start_time', null),
                'end_time' => $request->input('end_time', null),
                'weekend_usage' => (bool) $request->input('weekend_usage', true),
                'restrictions' => $request->input('restrictions', null),
                'status' => $request->input('is_active', true) ? 'active' : 'inactive'
            ]);

            Log::info('Configuration de ticket sauvegardée:', $config->toArray());

            return response()->json([
                'success' => true,
                'data' => $config->toArray(),
                'message' => 'Configuration de ticket créée avec succès'
            ], 201);

        } catch (\Exception $e) {
            Log::error('TicketConfigurationController@store - Erreur: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified ticket configuration.
     */
    public function show(string $id): JsonResponse
    {
        try {
            // Trouver en MySQL
            $config = \App\Models\TicketConfiguration::find($id);

            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuration non trouvée'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $config->toArray()
            ]);

        } catch (\Exception $e) {
            Log::error('TicketConfigurationController@show - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified ticket configuration.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            Log::info('TicketConfigurationController@update - Début pour ID: ' . $id);
            Log::info('Données reçues:', $request->all());

            // Validation des données
            $request->validate([
                'ticket_value' => 'nullable|numeric|min:100',
                'validity_duration_days' => 'nullable|integer|min:1|max:365',
                'type' => 'nullable|in:standard,premium,bonus',
                'auto_renewal' => 'boolean',
                'logo' => 'nullable|string'
            ]);

            // Trouver en MySQL
            $config = \App\Models\TicketConfiguration::find($id);

            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuration non trouvée'
                ], 404);
            }

            // Mettre à jour les champs fournis avec mapping correct
            $updateData = [];
            if ($request->filled('ticket_value')) $updateData['ticket_value'] = (float) $request->input('ticket_value');
            if ($request->filled('validity_duration_days')) $updateData['validity_days'] = (int) $request->input('validity_duration_days');
            if ($request->filled('monthly_allocation')) $updateData['monthly_allocation'] = (int) $request->input('monthly_allocation');
            if ($request->has('rollover_unused')) $updateData['rollover_unused'] = (bool) $request->input('rollover_unused');
            if ($request->filled('max_order_amount')) $updateData['max_order_amount'] = $request->input('max_order_amount');
            if ($request->filled('allowed_days')) $updateData['allowed_days'] = $request->input('allowed_days');
            if ($request->filled('start_time')) $updateData['start_time'] = $request->input('start_time');
            if ($request->filled('end_time')) $updateData['end_time'] = $request->input('end_time');
            if ($request->has('weekend_usage')) $updateData['weekend_usage'] = (bool) $request->input('weekend_usage');
            if ($request->filled('restrictions')) $updateData['restrictions'] = $request->input('restrictions');
            if ($request->has('is_active')) $updateData['status'] = $request->input('is_active') ? 'active' : 'inactive';

            $config->update($updateData);
            $config->refresh();

            Log::info('Configuration mise à jour:', $config->toArray());

            return response()->json([
                'success' => true,
                'data' => $config->toArray(),
                'message' => 'Configuration mise à jour avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('TicketConfigurationController@update - Erreur: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified ticket configuration.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            Log::info('TicketConfigurationController@destroy - Suppression ID: ' . $id);

            // Supprimer en MySQL
            $config = \App\Models\TicketConfiguration::find($id);

            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuration non trouvée'
                ], 404);
            }

            // Vérifier s'il y a des souches de tickets associées
            $batchesCount = \App\Models\TicketBatch::where('config_id', $id)->count();
            if ($batchesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de supprimer cette configuration car elle est liée à {$batchesCount} souche(s) de tickets. Vous pouvez la désactiver à la place."
                ], 422);
            }

            $config->delete();

            Log::info('Configuration supprimée avec succès: ' . $id);

            return response()->json([
                'success' => true,
                'message' => 'Configuration supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('TicketConfigurationController@destroy - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Debug endpoint to help diagnose frontend issues.
     */
    public function debug(Request $request): JsonResponse
    {
        try {
            $companyId = $request->header('X-User-Company-Id');
            $userRole = $request->header('X-User-Role');

            $allConfigs = \App\Models\TicketConfiguration::all();
            $companyConfigs = \App\Models\TicketConfiguration::where('company_id', $companyId)->get();
            $activeConfigs = \App\Models\TicketConfiguration::where('company_id', $companyId)
                ->where('status', 'active')
                ->get();

            return response()->json([
                'success' => true,
                'debug_info' => [
                    'headers_received' => [
                        'X-User-Company-Id' => $companyId,
                        'X-User-Role' => $userRole
                    ],
                    'counts' => [
                        'total_configs_in_db' => $allConfigs->count(),
                        'configs_for_this_company' => $companyConfigs->count(),
                        'active_configs_for_this_company' => $activeConfigs->count()
                    ],
                    'all_configs' => $allConfigs->toArray(),
                    'company_configs' => $companyConfigs->toArray(),
                    'active_configs' => $activeConfigs->toArray()
                ],
                'message' => 'Debug info - Ce endpoint aide à diagnostiquer les problèmes de chargement'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Get active ticket configuration for a company.
     */
    public function getActiveConfig(Request $request): JsonResponse
    {
        try {
            $companyId = $request->input('company_id', $request->header('X-User-Company-Id', '1'));

            Log::info('====================================');
            Log::info('TicketConfigurationController@getActiveConfig - DÉBUT');
            Log::info('Company ID (input): ' . $request->input('company_id', 'NULL'));
            Log::info('Company ID (header): ' . $request->header('X-User-Company-Id', 'NULL'));
            Log::info('Company ID final: ' . $companyId);
            Log::info('Tous les headers:', $request->headers->all());

            // Trouver la configuration active en MySQL (utiliser 'status', pas 'is_active')
            $activeConfig = \App\Models\TicketConfiguration::where('company_id', $companyId)
                ->where('status', 'active')
                ->first();

            if (!$activeConfig) {
                Log::warning('⚠️ Aucune configuration active trouvée pour company_id: ' . $companyId);
                Log::info('Total configurations en BDD: ' . \App\Models\TicketConfiguration::count());
                Log::info('Configurations pour company_id ' . $companyId . ': ' . \App\Models\TicketConfiguration::where('company_id', $companyId)->count());
                Log::info('getActiveConfig - FIN (NOT FOUND)');
                Log::info('====================================');
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune configuration active trouvée pour cette entreprise'
                ], 404);
            }

            Log::info('✅ Configuration active trouvée: ' . $activeConfig->id);
            Log::info('  → Company: ' . $activeConfig->company_name);
            Log::info('  → Valeur: ' . $activeConfig->ticket_value . 'F');
            Log::info('  → Status: ' . $activeConfig->status);
            Log::info('getActiveConfig - FIN (SUCCESS)');
            Log::info('====================================');

            return response()->json([
                'success' => true,
                'data' => $activeConfig->toArray()
            ]);

        } catch (\Exception $e) {
            Log::error('❌ TicketConfigurationController@getActiveConfig - ERREUR: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la configuration active',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
