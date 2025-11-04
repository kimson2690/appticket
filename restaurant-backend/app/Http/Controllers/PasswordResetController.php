<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\PasswordReset;

class PasswordResetController extends Controller
{
    private $resetTokensFile = 'password_reset_tokens.json';
    private $employeesFile = 'employees.json';

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
            $user = null;
            $userName = null;
            $userType = null;

            // Chercher d'abord dans la table users
            $dbUser = User::where('email', $email)->first();
            
            if ($dbUser) {
                $user = $dbUser;
                $userName = $dbUser->name;
                $userType = 'user';
                Log::info("Utilisateur trouvé dans la base de données: $email");
            } else {
                // Chercher dans employees.json
                $employees = $this->loadEmployees();
                $employee = collect($employees)->firstWhere('email', $email);
                
                if ($employee) {
                    $user = $employee;
                    $userName = $employee['name'];
                    $userType = 'employee';
                    Log::info("Employé trouvé dans employees.json: $email");
                }
            }

            if (!$user) {
                // Ne pas révéler si l'email existe ou non (sécurité)
                Log::warning("Tentative de reset pour email inexistant: $email");
                return response()->json([
                    'success' => true,
                    'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'
                ]);
            }

            // Générer un token unique
            $token = Str::random(60);
            $expiresAt = now()->addHours(1)->toDateTimeString();

            // Sauvegarder le token
            $this->saveResetToken($email, $token, $userType, $expiresAt);

            // Créer l'URL de réinitialisation
            $resetUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/reset-password?token=' . $token . '&email=' . urlencode($email);

            // Envoyer l'email
            Mail::to($email)->send(new PasswordReset($userName, $token, $resetUrl));
            
            Log::info("Email de réinitialisation envoyé à: $email, Token: $token");

            return response()->json([
                'success' => true,
                'message' => 'Un email de réinitialisation a été envoyé.'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur demande réinitialisation: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
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

            // Vérifier le token
            $resetTokenData = $this->verifyResetToken($email, $token);
            
            if (!$resetTokenData) {
                return response()->json([
                    'error' => 'Token invalide ou expiré'
                ], 400);
            }

            $userType = $resetTokenData['user_type'];

            // Mettre à jour le mot de passe selon le type d'utilisateur
            if ($userType === 'user') {
                // Utilisateur dans la base de données
                $user = User::where('email', $email)->first();
                
                if (!$user) {
                    return response()->json(['error' => 'Utilisateur non trouvé'], 404);
                }

                $user->password = Hash::make($newPassword);
                $user->save();
                
                Log::info("Mot de passe réinitialisé pour utilisateur DB: $email");
            } else {
                // Employé dans employees.json
                $employees = $this->loadEmployees();
                $employeeIndex = collect($employees)->search(function ($emp) use ($email) {
                    return $emp['email'] === $email;
                });

                if ($employeeIndex === false) {
                    return response()->json(['error' => 'Employé non trouvé'], 404);
                }

                $employees[$employeeIndex]['password'] = Hash::make($newPassword);
                $this->saveEmployees($employees);
                
                Log::info("Mot de passe réinitialisé pour employé JSON: $email");
            }

            // Supprimer le token utilisé
            $this->deleteResetToken($email);

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur réinitialisation mot de passe: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Sauvegarder un token de réinitialisation
     */
    private function saveResetToken($email, $token, $userType, $expiresAt)
    {
        // Supprimer les anciens tokens pour cet email
        \App\Models\PasswordResetToken::where('email', $email)->delete();

        // Créer le nouveau token en MySQL
        \App\Models\PasswordResetToken::create([
            'email' => $email,
            'token' => $token,
            'expires_at' => $expiresAt
        ]);
    }

    /**
     * Vérifier un token de réinitialisation
     */
    private function verifyResetToken($email, $token)
    {
        // Chercher le token en MySQL
        $tokenData = \App\Models\PasswordResetToken::where('email', $email)
            ->where('token', $token)
            ->first();

        if (!$tokenData) {
            return null;
        }

        // Vérifier l'expiration
        if ($tokenData->expires_at->isPast()) {
            Log::warning("Token expiré pour: $email");
            return null;
        }

        return $tokenData->toArray();
    }

    /**
     * Supprimer un token de réinitialisation
     */
    private function deleteResetToken($email)
    {
        // Supprimer les tokens en MySQL
        \App\Models\PasswordResetToken::where('email', $email)->delete();
    }

    /**
     * Charger les employés depuis MySQL
     */
    private function loadEmployees()
    {
        return \App\Models\Employee::all()->toArray();
    }

    /**
     * Sauvegarder les employés
     */
    private function saveEmployees($employees)
    {
        $filePath = storage_path('app/' . $this->employeesFile);
        file_put_contents($filePath, json_encode($employees, JSON_PRETTY_PRINT));
    }
}
