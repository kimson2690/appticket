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
            // Stockage persistant en fichier
            $filePath = storage_path('app/ticket_configurations.json');
            
            if (file_exists($filePath)) {
                $configurations = json_decode(file_get_contents($filePath), true) ?? [];
            } else {
                $configurations = [];
            }

            // Filtrage par rôle
            $userRole = $request->header('X-User-Role');
            $userCompanyId = $request->header('X-User-Company-Id');
            
            Log::info('TicketConfigurationController@index - Rôle: ' . $userRole . ', Company ID: ' . $userCompanyId);
            
            // Si c'est un gestionnaire d'entreprise, filtrer par son entreprise uniquement
            if ($userRole === 'Gestionnaire Entreprise' && $userCompanyId) {
                $configurations = array_filter($configurations, function($config) use ($userCompanyId) {
                    return isset($config['company_id']) && $config['company_id'] === $userCompanyId;
                });
                Log::info('Configurations filtrées pour gestionnaire: ' . count($configurations));
            }
            // Si c'est un administrateur, il voit TOUTES les configurations (pas de filtre)
            
            return response()->json([
                'success' => true,
                'data' => array_values($configurations)
            ]);
        } catch (\Exception $e) {
            Log::error('TicketConfigurationController@index - Erreur: ' . $e->getMessage());
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
                'type' => 'required|in:standard,premium,bonus',
                'auto_renewal' => 'boolean',
                'logo' => 'nullable|string'
            ]);

            $ticketValue = $request->input('ticket_value');
            $validityDurationDays = $request->input('validity_duration_days');
            $type = $request->input('type');
            $autoRenewal = $request->input('auto_renewal', false);
            $logo = $request->input('logo', null);
            $companyId = $request->input('company_id', $request->header('X-User-Company-Id', '1'));

            // Charger les configurations existantes
            $filePath = storage_path('app/ticket_configurations.json');
            $configurations = [];
            
            if (file_exists($filePath)) {
                $configurations = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Créer la nouvelle configuration
            $configData = [
                'id' => 'config_' . time() . '_' . rand(1000, 9999),
                'company_id' => $companyId,
                'ticket_value' => (float) $ticketValue,
                'validity_duration_days' => (int) $validityDurationDays,
                'type' => $type,
                'auto_renewal' => (bool) $autoRenewal,
                'logo' => $logo,
                'is_active' => true,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ];

            // Ajouter à la liste
            $configurations[] = $configData;

            // Sauvegarder dans le fichier
            file_put_contents($filePath, json_encode($configurations, JSON_PRETTY_PRINT));

            Log::info('Configuration de ticket sauvegardée:', $configData);

            return response()->json([
                'success' => true,
                'data' => $configData,
                'message' => 'Configuration de ticket créée avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('TicketConfigurationController@store - Erreur: ' . $e->getMessage());
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
            // Charger les configurations depuis le fichier
            $filePath = storage_path('app/ticket_configurations.json');
            $configurations = [];
            
            if (file_exists($filePath)) {
                $configurations = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Trouver la configuration par ID
            $configuration = collect($configurations)->firstWhere('id', $id);

            if (!$configuration) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuration non trouvée'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $configuration
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
                'ticket_value' => 'required|numeric|min:100',
                'validity_duration_days' => 'required|integer|min:1|max:365',
                'type' => 'required|in:standard,premium,bonus',
                'auto_renewal' => 'boolean',
                'logo' => 'nullable|string'
            ]);

            // Charger les configurations depuis le fichier
            $filePath = storage_path('app/ticket_configurations.json');
            $configurations = [];
            
            if (file_exists($filePath)) {
                $configurations = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Trouver l'index de la configuration
            $configIndex = collect($configurations)->search(function ($config) use ($id) {
                return $config['id'] === $id;
            });

            if ($configIndex === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuration non trouvée'
                ], 404);
            }

            // Mettre à jour la configuration
            $updateData = [
                'ticket_value' => (float) $request->input('ticket_value'),
                'validity_duration_days' => (int) $request->input('validity_duration_days'),
                'type' => $request->input('type'),
                'auto_renewal' => (bool) $request->input('auto_renewal', false),
                'updated_at' => date('Y-m-d H:i:s'),
            ];
            
            // Ajouter le logo seulement s'il est fourni
            if ($request->has('logo')) {
                $updateData['logo'] = $request->input('logo');
            }
            
            $configurations[$configIndex] = array_merge($configurations[$configIndex], $updateData);

            // Sauvegarder dans le fichier
            file_put_contents($filePath, json_encode($configurations, JSON_PRETTY_PRINT));

            Log::info('Configuration mise à jour:', $configurations[$configIndex]);

            return response()->json([
                'success' => true,
                'data' => $configurations[$configIndex],
                'message' => 'Configuration mise à jour avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('TicketConfigurationController@update - Erreur: ' . $e->getMessage());
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
            
            // Charger les configurations depuis le fichier
            $filePath = storage_path('app/ticket_configurations.json');
            $configurations = [];
            
            if (file_exists($filePath)) {
                $configurations = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Filtrer pour supprimer la configuration
            $originalCount = count($configurations);
            $configurations = array_values(array_filter($configurations, function ($config) use ($id) {
                return $config['id'] !== $id;
            }));

            if (count($configurations) === $originalCount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configuration non trouvée'
                ], 404);
            }

            // Sauvegarder dans le fichier
            file_put_contents($filePath, json_encode($configurations, JSON_PRETTY_PRINT));

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
     * Get active ticket configuration for a company.
     */
    public function getActiveConfig(Request $request): JsonResponse
    {
        try {
            $companyId = $request->input('company_id', $request->header('X-User-Company-Id', '1'));
            
            // Charger les configurations depuis le fichier
            $filePath = storage_path('app/ticket_configurations.json');
            $configurations = [];
            
            if (file_exists($filePath)) {
                $configurations = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Trouver la configuration active pour l'entreprise
            $activeConfig = collect($configurations)->first(function ($config) use ($companyId) {
                return $config['company_id'] === $companyId && 
                       ($config['is_active'] ?? true);
            });

            if (!$activeConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune configuration active trouvée pour cette entreprise'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $activeConfig
            ]);
            
        } catch (\Exception $e) {
            Log::error('TicketConfigurationController@getActiveConfig - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la configuration active',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
