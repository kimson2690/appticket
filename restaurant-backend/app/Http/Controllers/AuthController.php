<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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

            // Chercher l'utilisateur par email
            $user = User::with(['role', 'company', 'restaurant'])
                ->where('email', $credentials['email'])
                ->first();

            // Vérifier si l'utilisateur existe et si le mot de passe est correct
            if (!$user || !Hash::check($credentials['password'], $user->password)) {
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

            // Générer un token (pour l'instant, on utilise un token simple)
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
