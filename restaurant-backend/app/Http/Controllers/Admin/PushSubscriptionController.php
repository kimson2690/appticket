<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PushSubscriptionController extends Controller
{
    /**
     * Enregistrer un abonnement push pour l'utilisateur courant
     */
    public function subscribe(Request $request)
    {
        try {
            $request->validate([
                'endpoint' => 'required|string|url',
                'keys.p256dh' => 'required|string',
                'keys.auth' => 'required|string',
            ]);

            $userId = $request->header('X-User-Id');

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Utilisateur non identifié'
                ], 401);
            }

            // Upsert: créer ou mettre à jour si l'endpoint existe déjà
            $subscription = PushSubscription::updateOrCreate(
                ['endpoint' => $request->input('endpoint')],
                [
                    'user_id' => $userId,
                    'p256dh_key' => $request->input('keys.p256dh'),
                    'auth_token' => $request->input('keys.auth'),
                    'user_agent' => $request->header('User-Agent'),
                ]
            );

            Log::info("Push subscription enregistrée pour user {$userId}", [
                'subscription_id' => $subscription->id,
                'endpoint' => substr($request->input('endpoint'), 0, 80) . '...'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Abonnement push enregistré avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur enregistrement push subscription: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un abonnement push (désabonnement)
     */
    public function unsubscribe(Request $request)
    {
        try {
            $request->validate([
                'endpoint' => 'required|string',
            ]);

            $deleted = PushSubscription::where('endpoint', $request->input('endpoint'))->delete();

            Log::info("Push subscription supprimée", [
                'endpoint' => substr($request->input('endpoint'), 0, 80) . '...',
                'deleted' => $deleted
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Désabonnement push effectué'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur désabonnement push: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du désabonnement'
            ], 500);
        }
    }

    /**
     * Récupérer la clé publique VAPID pour le frontend
     */
    public function getVapidPublicKey()
    {
        $publicKey = env('VAPID_PUBLIC_KEY');

        if (!$publicKey) {
            return response()->json([
                'success' => false,
                'message' => 'Clé VAPID non configurée'
            ], 500);
        }

        return response()->json([
            'success' => true,
            'public_key' => $publicKey
        ]);
    }
}
