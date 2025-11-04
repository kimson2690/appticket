<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
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

            Log::info('NotificationController@index - Récupération depuis MySQL:', [
                'user_id' => $userId,
                'role' => $userRole
            ]);

            // Query MySQL avec filtres
            $query = \App\Models\Notification::query();

            // Notification directement pour cet utilisateur OU pour son rôle
            $query->where(function($q) use ($userId, $userRole, $userCompanyId, $userRestaurantId) {
                $q->where('user_id', $userId)
                  ->orWhere(function($roleQuery) use ($userRole, $userCompanyId, $userRestaurantId) {
                      $roleQuery->where('role', $userRole);
                      
                      if ($userRole === 'Gestionnaire Entreprise' && $userCompanyId) {
                          $roleQuery->where('company_id', $userCompanyId);
                      }
                      
                      if ($userRole === 'Gestionnaire Restaurant' && $userRestaurantId) {
                          $roleQuery->where('restaurant_id', $userRestaurantId);
                      }
                  });
            });

            $userNotifications = $query->orderBy('created_at', 'desc')->get()->toArray();

            return response()->json([
                'success' => true,
                'notifications' => $userNotifications
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
            $notification = \App\Models\Notification::find($id);

            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification non trouvée'
                ], 404);
            }

            $notification->update([
                'read' => true,
                'read_at' => now()
            ]);

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

            $count = \App\Models\Notification::where('user_id', $userId)
                ->where('read', false)
                ->update([
                    'read' => true,
                    'read_at' => now()
                ]);

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
            $notification = \App\Models\Notification::find($id);
            
            if (!$notification) {
                return response()->json([
                    'success' => false,
                    'message' => 'Notification non trouvée'
                ], 404);
            }

            $notification->delete();

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
     * Créer une notification (méthode statique pour être appelée depuis d'autres contrôleurs)
     */
    public static function createNotification($data)
    {
        try {
            // Créer en MySQL
            $notification = \App\Models\Notification::create([
                'id' => 'notif_' . time() . '_' . rand(1000, 9999),
                'type' => $data['type'] ?? 'info',
                'title' => $data['title'],
                'message' => $data['message'],
                'user_id' => $data['user_id'] ?? null,
                'role' => $data['role'] ?? null,
                'company_id' => $data['company_id'] ?? null,
                'restaurant_id' => $data['restaurant_id'] ?? null,
                'action_url' => $data['action_url'] ?? null,
                'metadata' => $data['metadata'] ?? [],
                'read' => false,
                'read_at' => null
            ]);

            Log::info('Notification créée en MySQL', $notification->toArray());

            return $notification->toArray();

        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de notification: ' . $e->getMessage());
            return null;
        }
    }
}
