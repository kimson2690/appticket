<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Employee;
use App\Models\PasswordResetToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\PasswordReset;

class PasswordResetController extends Controller
{
    /**
     * Demande de réinitialisation de mot de passe
     */
    public function forgotPassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email'
            ]);

            $email = $validated['email'];
            $userName = null;
            $userType = null;

            // Chercher d'abord dans la table users (admins, gestionnaires)
            $dbUser = User::where('email', $email)->first();

            if ($dbUser) {
                $userName = $dbUser->name;
                $userType = 'user';
                Log::info("Utilisateur trouvé dans la table users: $email");
            } else {
                // Chercher dans la table employees (MySQL)
                $employee = Employee::where('email', $email)->first();

                if ($employee) {
                    $userName = $employee->name;
                    $userType = 'employee';
                    Log::info("Employé trouvé dans la table employees: $email");
                }
            }

            if (!$userType) {
                // Ne pas révéler si l'email existe ou non (sécurité)
                Log::warning("Tentative de reset pour email inexistant: $email");
                return response()->json([
                    'success' => true,
                    'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'
                ]);
            }

            // Générer un token unique
            $token = Str::random(60);
            $expiresAt = now()->addHours(1);

            // Sauvegarder le token en MySQL
            PasswordResetToken::where('email', $email)->delete();
            PasswordResetToken::create([
                'email' => $email,
                'token' => $token,
                'expires_at' => $expiresAt,
                'user_type' => $userType
            ]);

            // Créer l'URL de réinitialisation
            $resetUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/reset-password?token=' . $token . '&email=' . urlencode($email);

            // Envoyer l'email (send synchrone, plus fiable que queue)
            Mail::to($email)->send(new PasswordReset($userName, $token, $resetUrl));

            Log::info("Email de réinitialisation envoyé à: $email");

            return response()->json([
                'success' => true,
                'message' => 'Un email de réinitialisation a été envoyé.'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur demande réinitialisation: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Erreur serveur: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Réinitialiser le mot de passe
     */
    public function resetPassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'token' => 'required|string',
                'password' => 'required|string|min:8|confirmed'
            ]);

            $email = $validated['email'];
            $token = $validated['token'];
            $newPassword = $validated['password'];

            // Vérifier le token en MySQL
            $tokenRecord = PasswordResetToken::where('email', $email)
                ->where('token', $token)
                ->first();

            if (!$tokenRecord) {
                return response()->json([
                    'success' => false,
                    'error' => 'Token invalide ou expiré'
                ], 400);
            }

            // Vérifier l'expiration
            if ($tokenRecord->expires_at && $tokenRecord->expires_at->isPast()) {
                PasswordResetToken::where('email', $email)->delete();
                return response()->json([
                    'success' => false,
                    'error' => 'Token expiré. Veuillez faire une nouvelle demande.'
                ], 400);
            }

            $userType = $tokenRecord->user_type ?? 'user';

            // Mettre à jour le mot de passe selon le type d'utilisateur
            if ($userType === 'user') {
                $user = User::where('email', $email)->first();

                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Utilisateur non trouvé'
                    ], 404);
                }

                $user->password = Hash::make($newPassword);
                $user->save();

                Log::info("Mot de passe réinitialisé pour utilisateur: $email");
            } else {
                // Employé dans la table employees (MySQL)
                $employee = Employee::where('email', $email)->first();

                if (!$employee) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Employé non trouvé'
                    ], 404);
                }

                $employee->password = Hash::make($newPassword);
                $employee->must_change_password = false;
                $employee->save();

                Log::info("Mot de passe réinitialisé pour employé: $email");
            }

            // Supprimer le token utilisé
            PasswordResetToken::where('email', $email)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur réinitialisation mot de passe: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur serveur'
            ], 500);
        }
    }
}
