<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private $serviceUrl;
    private $enabled;

    public function __construct()
    {
        $this->serviceUrl = env('WHATSAPP_SERVICE_URL', 'http://localhost:3001');
        $this->enabled = env('PUSH_NOTIFICATIONS_ENABLED', true);
    }

    /**
     * Envoyer une notification push à un utilisateur spécifique
     */
    public function sendToUser(string $userId, string $title, string $body, array $data = []): int
    {
        if (!$this->enabled) {
            Log::info("Push notifications désactivées - non envoyé à {$userId}");
            return 0;
        }

        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            Log::info("Aucun abonnement push pour user {$userId}");
            return 0;
        }

        $sent = 0;
        foreach ($subscriptions as $subscription) {
            if ($this->sendPush($subscription, $title, $body, $data)) {
                $sent++;
            }
        }

        Log::info("Push envoyé à {$sent}/{$subscriptions->count()} device(s) pour user {$userId}");
        return $sent;
    }

    /**
     * Envoyer une notification push à plusieurs utilisateurs
     */
    public function sendToUsers(array $userIds, string $title, string $body, array $data = []): int
    {
        if (!$this->enabled) {
            return 0;
        }

        $subscriptions = PushSubscription::whereIn('user_id', $userIds)->get();
        $sent = 0;

        foreach ($subscriptions as $subscription) {
            if ($this->sendPush($subscription, $title, $body, $data)) {
                $sent++;
            }
        }

        return $sent;
    }

    /**
     * Envoyer une notification push à tous les utilisateurs d'un rôle
     */
    public function sendToRole(string $role, string $title, string $body, array $data = [], ?int $companyId = null, ?int $restaurantId = null): int
    {
        if (!$this->enabled) {
            return 0;
        }

        // Récupérer les user_ids correspondant au rôle
        $query = \App\Models\User::where('role', $role);

        if ($companyId) {
            $query->where('company_id', $companyId);
        }
        if ($restaurantId) {
            $query->where('restaurant_id', $restaurantId);
        }

        $userIds = $query->pluck('id')->toArray();

        if (empty($userIds)) {
            return 0;
        }

        return $this->sendToUsers($userIds, $title, $body, $data);
    }

    /**
     * Envoyer le push via le service Node.js
     */
    private function sendPush(PushSubscription $subscription, string $title, string $body, array $data = []): bool
    {
        try {
            $payload = [
                'subscription' => [
                    'endpoint' => $subscription->endpoint,
                    'keys' => [
                        'p256dh' => $subscription->p256dh_key,
                        'auth' => $subscription->auth_token,
                    ]
                ],
                'title' => $title,
                'body' => $body,
                'icon' => '/AppTicket.png',
                'badge' => '/AppTicket.png',
                'data' => $data,
            ];

            $response = Http::timeout(10)->post("{$this->serviceUrl}/push/send", $payload);

            if ($response->successful()) {
                return true;
            }

            // Si le endpoint est invalide (410 Gone ou 404), supprimer l'abonnement
            $responseData = $response->json();
            if (isset($responseData['expired']) && $responseData['expired']) {
                Log::info("Push subscription expirée, suppression", ['id' => $subscription->id]);
                $subscription->delete();
            }

            return false;

        } catch (\Exception $e) {
            Log::error("Erreur envoi push: " . $e->getMessage(), [
                'subscription_id' => $subscription->id,
                'user_id' => $subscription->user_id
            ]);
            return false;
        }
    }
}
