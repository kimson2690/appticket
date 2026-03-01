<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Authentifier un utilisateur
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $credentials = $request->validate([
                'email' => 'required|email',
                'password' => 'required'
            ]);

            Log::info('Tentative de connexion pour: ' . $credentials['email']);

            // Chercher d'abord dans les utilisateurs (admins, gestionnaires)
            $user = User::with(['role', 'company', 'restaurant'])
                ->where('email', $credentials['email'])
                ->first();

            if ($user) {
                Log::info('Utilisateur trouvé dans users table');

                // Vérifier le mot de passe
                if (!Hash::check($credentials['password'], $user->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Identifiants incorrects'
                    ], 401);
                }

                // Vérifier si l'utilisateur est actif
                if ($user->status !== 'active') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Compte désactivé. Contactez l\'administrateur.'
                    ], 403);
                }

                // Vérifier si l'entreprise associée est suspendue
                if ($user->company_id && $user->company) {
                    if ($user->company->status === 'suspended') {
                        Log::info('Connexion refusée - entreprise suspendue: ' . $user->company->name);
                        return response()->json([
                            'success' => false,
                            'message' => 'Votre entreprise a été suspendue. Contactez l\'administrateur pour plus d\'informations.'
                        ], 403);
                    }
                    if ($user->company->status === 'inactive') {
                        Log::info('Connexion refusée - entreprise inactive: ' . $user->company->name);
                        return response()->json([
                            'success' => false,
                            'message' => 'Votre entreprise est inactive. Contactez l\'administrateur pour plus d\'informations.'
                        ], 403);
                    }
                }

                // Générer un token
                $token = 'token_' . $user->id . '_' . time();

                return response()->json([
                    'success' => true,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'role' => $user->role->name ?? 'Utilisateur',
                        'role_id' => $user->role_id,
                        'company_id' => $user->company_id,
                        'company_name' => $user->company->name ?? null,
                        'restaurant_id' => $user->restaurant_id,
                        'restaurant_name' => $user->restaurant->name ?? null,
                        'status' => $user->status
                    ],
                    'token' => $token
                ]);
            }

            // Si pas trouvé dans users, chercher dans employees (MySQL)
            Log::info('Utilisateur non trouvé dans users, recherche dans employees MySQL');

            $employee = \App\Models\Employee::where('email', $credentials['email'])->first();

            if ($employee) {
                Log::info('Employé trouvé dans MySQL');

                // Vérifier le mot de passe
                if ($employee->password && !Hash::check($credentials['password'], $employee->password)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Identifiants incorrects'
                    ], 401);
                }

                // Vérifier le statut
                if ($employee->status !== 'active') {
                    $message = $employee->status === 'pending'
                        ? 'Votre demande est en attente de validation par le gestionnaire.'
                        : 'Compte désactivé. Contactez l\'administrateur.';

                    return response()->json([
                        'success' => false,
                        'message' => $message
                    ], 403);
                }

                // Vérifier si l'entreprise associée est suspendue
                $company = null;
                if ($employee->company_id) {
                    $company = \App\Models\Company::find($employee->company_id);
                    if ($company && $company->status === 'suspended') {
                        Log::info('Connexion employé refusée - entreprise suspendue: ' . $company->name);
                        return response()->json([
                            'success' => false,
                            'message' => 'Votre entreprise a été suspendue. Contactez l\'administrateur pour plus d\'informations.'
                        ], 403);
                    }
                    if ($company && $company->status === 'inactive') {
                        Log::info('Connexion employé refusée - entreprise inactive: ' . $company->name);
                        return response()->json([
                            'success' => false,
                            'message' => 'Votre entreprise est inactive. Contactez l\'administrateur pour plus d\'informations.'
                        ], 403);
                    }
                }

                // Générer un token
                $token = 'token_' . $employee->id . '_' . time();

                return response()->json([
                    'success' => true,
                    'user' => [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'email' => $employee->email,
                        'phone' => $employee->phone ?? null,
                        'role' => 'Utilisateur',
                        'role_id' => null,
                        'company_id' => $employee->company_id ?? null,
                        'company_name' => $employee->company_name ?? null,
                        'restaurant_id' => null,
                        'restaurant_name' => null,
                        'status' => $employee->status,
                        'must_change_password' => (bool) $employee->must_change_password,
                        'ordering_enabled' => $company ? (bool) $company->ordering_enabled : true,
                    ],
                    'token' => $token
                ]);
            }

            // Aucun utilisateur trouvé
            Log::info('Aucun utilisateur trouvé avec cet email');
            return response()->json([
                'success' => false,
                'message' => 'Identifiants incorrects'
            ], 401);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la connexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Déconnecter un utilisateur
     */
    public function logout(Request $request): JsonResponse
    {
        // Pour l'instant, on retourne juste un succès
        // Dans une vraie app, on invaliderait le token
        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }

    /**
     * Changer le mot de passe (première connexion employé)
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'employee_id' => 'required|string',
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6|confirmed',
            ]);

            $employee = \App\Models\Employee::find($request->employee_id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Vérifier le mot de passe actuel
            if (!Hash::check($request->current_password, $employee->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le mot de passe actuel est incorrect'
                ], 401);
            }

            // Vérifier que le nouveau mot de passe est différent de l'ancien
            if (Hash::check($request->new_password, $employee->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le nouveau mot de passe doit être différent de l\'ancien'
                ], 422);
            }

            // Mettre à jour le mot de passe et désactiver le flag
            $employee->password = Hash::make($request->new_password);
            $employee->must_change_password = false;
            $employee->save();

            Log::info('Mot de passe changé pour employé: ' . $employee->id);

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe modifié avec succès'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Erreur changement mot de passe: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de mot de passe'
            ], 500);
        }
    }

    /**
     * Obtenir les informations de l'utilisateur connecté
     */
    public function me(Request $request): JsonResponse
    {
        // Pour l'instant, on simule avec l'admin
        // Dans une vraie app, on récupérerait l'utilisateur depuis le token
        return response()->json([
            'success' => true,
            'user' => [
                'id' => 1,
                'email' => 'admin@appticket.com',
                'role' => 'admin'
            ]
        ]);
    }
}
