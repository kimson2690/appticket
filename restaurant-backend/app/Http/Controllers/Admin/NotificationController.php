<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
    private $notificationsFile;

    public function __construct()
    {
        $this->notificationsFile = storage_path('app/notifications.json');
        
        // Créer le fichier s'il n'existe pas
        if (!file_exists($this->notificationsFile)) {
            file_put_contents($this->notificationsFile, json_encode([]));
        }
    }

    /**
     * Récupérer les notifications d'un utilisateur
     */
    public function index(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');
            $userRole = $request->header('X-User-Role');
            $userCompanyId = $request->header('X-User-Company-Id');
            $userRestaurantId = $request->header('X-User-Restaurant-Id');

            Log::info('NotificationController@index - Récupération des notifications pour:', [
                'user_id' => $userId,
                'role' => $userRole,
                'company_id' => $userCompanyId,
                'restaurant_id' => $userRestaurantId
            ]);

            $notifications = $this->loadNotifications();

            // Filtrer les notifications selon le rôle et l'utilisateur
            $userNotifications = array_filter($notifications, function($notif) use ($userId, $userRole, $userCompanyId, $userRestaurantId) {
                // Notification directement pour cet utilisateur
                if (isset($notif['user_id']) && $notif['user_id'] === $userId) {
                    return true;
                }

                // Notification pour un rôle spécifique
                if (isset($notif['role']) && $notif['role'] === $userRole) {
                    // Si notification pour gestionnaire entreprise, vérifier l'entreprise
                    if ($userRole === 'Gestionnaire Entreprise' && isset($notif['company_id'])) {
                        return $notif['company_id'] === $userCompanyId;
                    }
                    
                    // Si notification pour gestionnaire restaurant, vérifier le restaurant
                    if ($userRole === 'Gestionnaire Restaurant' && isset($notif['restaurant_id'])) {
                        return $notif['restaurant_id'] === $userRestaurantId;
                    }
                    
                    return true;
                }

                return false;
            });

            // Trier par date décroissante
            usort($userNotifications, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            return response()->json([
                'success' => true,
                'notifications' => array_values($userNotifications)
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des notifications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des notifications'
            ], 500);
        }
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $notifications = $this->loadNotifications();

            $found = false;
            foreach ($notifications as &$notif) {
                if ($notif['id'] === $id) {
                    $notif['read'] = true;
                    $notif['read_at'] = date('Y-m-d H:i:s');
                    $found = true;
                    break;
                }
            }

            if (!$found) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification non trouvée'
                ], 404);
            }

            $this->saveNotifications($notifications);

            return response()->json([
                'success' => true,
                'message' => 'Notification marquée comme lue'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du marquage: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du marquage'
            ], 500);
        }
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');
            $notifications = $this->loadNotifications();

            $count = 0;
            foreach ($notifications as &$notif) {
                if (isset($notif['user_id']) && $notif['user_id'] === $userId && !$notif['read']) {
                    $notif['read'] = true;
                    $notif['read_at'] = date('Y-m-d H:i:s');
                    $count++;
                }
            }

            $this->saveNotifications($notifications);

            return response()->json([
                'success' => true,
                'message' => "$count notification(s) marquée(s) comme lue(s)",
                'count' => $count
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du marquage global: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du marquage global'
            ], 500);
        }
    }

    /**
     * Supprimer une notification
     */
    public function destroy($id)
    {
        try {
            $notifications = $this->loadNotifications();
            
            $filtered = array_filter($notifications, function($notif) use ($id) {
                return $notif['id'] !== $id;
            });

            if (count($notifications) === count($filtered)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification non trouvée'
                ], 404);
            }

            $this->saveNotifications(array_values($filtered));

            return response()->json([
                'success' => true,
                'message' => 'Notification supprimée'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression'
            ], 500);
        }
    }

    /**
     * Créer une nouvelle notification
     */
    public static function createNotification($data)
    {
        try {
            $notificationsFile = storage_path('app/notifications.json');
            
            if (!file_exists($notificationsFile)) {
                file_put_contents($notificationsFile, json_encode([]));
            }

            $notifications = json_decode(file_get_contents($notificationsFile), true) ?? [];

            $notification = [
                'id' => 'notif_' . time() . '_' . uniqid(),
                'type' => $data['type'] ?? 'info', // info, success, warning, alert
                'title' => $data['title'],
                'message' => $data['message'] ?? '',
                'user_id' => $data['user_id'] ?? null,
                'role' => $data['role'] ?? null,
                'company_id' => $data['company_id'] ?? null,
                'restaurant_id' => $data['restaurant_id'] ?? null,
                'action_url' => $data['action_url'] ?? null,
                'metadata' => $data['metadata'] ?? [],
                'read' => false,
                'read_at' => null,
                'created_at' => date('Y-m-d H:i:s')
            ];

            $notifications[] = $notification;

            file_put_contents($notificationsFile, json_encode($notifications, JSON_PRETTY_PRINT));

            Log::info('Notification créée', $notification);

            return $notification;

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Charger toutes les notifications
     */
    private function loadNotifications()
    {
        $content = file_get_contents($this->notificationsFile);
        return json_decode($content, true) ?? [];
    }

    /**
     * Sauvegarder les notifications
     */
    private function saveNotifications($notifications)
    {
        file_put_contents($this->notificationsFile, json_encode($notifications, JSON_PRETTY_PRINT));
    }
}
