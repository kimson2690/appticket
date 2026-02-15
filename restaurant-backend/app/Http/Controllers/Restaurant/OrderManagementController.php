<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderValidated;
use App\Mail\OrderRejected;
use App\Models\DeliveryLocation;
use App\Models\Restaurant;
use App\Models\MenuItem;
use App\Services\WhatsAppService;

class OrderManagementController extends Controller
{

    /**
     * Récupérer les commandes du restaurant
     */
    public function index(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');
            $userRole = $request->header('X-User-Role');

            Log::info('Récupération commandes restaurant - Restaurant ID: ' . $restaurantId . ', Role: ' . $userRole);

            if (!$restaurantId && $userRole !== 'Administrateur') {
                return response()->json(['error' => 'Restaurant ID manquant'], 401);
            }

            $orders = $this->loadOrders();
            $employees = $this->loadEmployees();
            $menuItems = MenuItem::all()->toArray();

            // Charger les lieux de livraison depuis la base de données
            $deliveryLocations = DeliveryLocation::all()->keyBy('id')->toArray();

            // Créer des index
            $employeesById = collect($employees)->keyBy('id')->toArray();
            $menuItemsById = collect($menuItems)->keyBy('id')->toArray();

            // Filtrer les commandes du restaurant
            $restaurantOrders = collect($orders);

            if ($userRole !== 'Administrateur') {
                $restaurantOrders = $restaurantOrders->where('restaurant_id', $restaurantId);
            }

            // Enrichir les commandes
            $enrichedOrders = $restaurantOrders->map(function ($order) use ($employeesById, $menuItemsById, $deliveryLocations) {
                // Ajouter les infos de l'employé
                if (isset($employeesById[$order['employee_id']])) {
                    $order['employee'] = $employeesById[$order['employee_id']];
                }

                // Ajouter les infos du lieu de livraison
                if (isset($order['delivery_location_id']) && isset($deliveryLocations[$order['delivery_location_id']])) {
                    $location = $deliveryLocations[$order['delivery_location_id']];
                    $order['delivery_location'] = [
                        'id' => $location['id'],
                        'name' => $location['name'],
                        'address' => $location['address'] ?? null,
                        'building' => $location['building'] ?? null,
                        'floor' => $location['floor'] ?? null,
                        'instructions' => $location['instructions'] ?? null,
                    ];
                }

                // Enrichir les items avec les détails des plats
                if (isset($order['items'])) {
                    $order['items'] = array_map(function ($item) use ($menuItemsById) {
                        // Priorité 1: Utiliser le nom stocké dans l'item (toujours présent maintenant)
                        if (isset($item['name'])) {
                            $item['details'] = [
                                'name' => $item['name'],
                                'category' => $item['category'] ?? null,
                                'description' => $item['description'] ?? null,
                                'image' => $item['image'] ?? null,
                            ];
                        }
                        // Priorité 2: Chercher dans menu_items
                        else if (isset($menuItemsById[$item['item_id']])) {
                            $menuItem = $menuItemsById[$item['item_id']];
                            $item['details'] = [
                                'name' => $menuItem['name'],
                                'category' => $menuItem['category'] ?? null,
                                'description' => $menuItem['description'] ?? null,
                                'image' => $menuItem['image'] ?? null,
                            ];
                        }
                        // Priorité 3: Chercher directement dans la BDD
                        else {
                            $menuItem = MenuItem::find($item['item_id']);
                            if ($menuItem) {
                                $item['details'] = [
                                    'name' => $menuItem->name,
                                    'category' => $menuItem->category ?? null,
                                    'description' => $menuItem->description ?? null,
                                    'image' => $menuItem->image ?? null,
                                ];
                            } else {
                                // Fallback final
                                $item['details'] = [
                                    'name' => 'Article ' . substr($item['item_id'], -4),
                                    'category' => null,
                                ];
                                Log::warning('Menu item not found: ' . $item['item_id']);
                            }
                        }
                        return $item;
                    }, $order['items']);
                }

                return $order;
            })
            ->sortByDesc('created_at')
            ->values()
            ->all();

            return response()->json([
                'success' => true,
                'data' => $enrichedOrders
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération commandes restaurant: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Valider une commande
     */
    public function validateOrder(Request $request, $id)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');
            $userId = $request->header('X-User-Id', '0');

            // Récupérer le nom depuis la base de données pour éviter les problèmes d'encodage du header
            $user = \App\Models\User::find($userId);
            $confirmedBy = $user ? $user->name : 'Gestionnaire';

            Log::info('Validation commande - User ID: ' . $userId . ' -> Nom depuis BDD: ' . $confirmedBy);

            $orders = $this->loadOrders();
            $orderIndex = collect($orders)->search(function ($order) use ($id) {
                return $order['id'] === $id;
            });

            if ($orderIndex === false) {
                return response()->json(['error' => 'Commande non trouvée'], 404);
            }

            $order = $orders[$orderIndex];

            // Vérifier que la commande appartient au restaurant
            if ($order['restaurant_id'] !== $restaurantId) {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            // Mettre à jour le statut
            $orders[$orderIndex]['status'] = 'confirmed';
            $orders[$orderIndex]['confirmed_by'] = $confirmedBy;
            $orders[$orderIndex]['confirmed_at'] = now()->toDateTimeString();
            $orders[$orderIndex]['updated_at'] = now()->toDateTimeString();

            $this->saveOrders($orders);

            // Mettre à jour les souches de tickets pour refléter la consommation
            $this->updateTicketBatchUsage($order['employee_id'], $order['total_amount']);

            Log::info('Commande validée: ' . $id . ' par ' . $confirmedBy);

            // Récupérer le nom du restaurant (priorité aux données de la commande)
            $restaurantName = 'Restaurant'; // Valeur par défaut

            // Priorité 1: Utiliser restaurant_name des items de la commande
            if (!empty($order['items'][0]['restaurant_name'])) {
                $restaurantName = $order['items'][0]['restaurant_name'];
            } else {
                // Priorité 2: Chercher dans restaurants.json (fallback)
                $restaurants = $this->loadRestaurants();
                $restaurant = collect($restaurants)->firstWhere('id', $order['restaurant_id']);
                if ($restaurant && !empty($restaurant['name'])) {
                    $restaurantName = $restaurant['name'];
                }
            }

            // Notification pour l'employé : commande validée
            NotificationController::createNotification([
                'type' => 'success',
                'title' => 'Commande validée ✅',
                'message' => "Votre commande chez $restaurantName d'un montant de {$order['total_amount']}F a été validée par le restaurant. Votre repas est en préparation !",
                'user_id' => $order['employee_id'],
                'action_url' => '/employee/orders',
                'metadata' => [
                    'order_id' => $id,
                    'restaurant_name' => $restaurantName,
                    'total_amount' => $order['total_amount'],
                    'confirmed_by' => $confirmedBy,
                    'confirmed_at' => $orders[$orderIndex]['confirmed_at']
                ]
            ]);

            // Notification pour inviter à noter la commande (envoyée avec un léger délai conceptuel)
            NotificationController::createNotification([
                'type' => 'info',
                'title' => '⭐ Notez votre commande',
                'message' => "Comment était votre repas chez $restaurantName ? Donnez votre avis pour aider les autres employés !",
                'user_id' => $order['employee_id'],
                'action_url' => '/employee/history',
                'metadata' => [
                    'order_id' => $id,
                    'restaurant_name' => $restaurantName,
                    'type' => 'review_invitation'
                ]
            ]);

            // Charger les informations du lieu de livraison si spécifié
            $deliveryLocation = null;
            if (isset($order['delivery_location_id'])) {
                $location = DeliveryLocation::find($order['delivery_location_id']);
                if ($location) {
                    $deliveryLocation = [
                        'name' => $location->name,
                        'address' => $location->address,
                        'building' => $location->building,
                        'floor' => $location->floor,
                        'instructions' => $location->instructions,
                    ];
                }
            }

            // Envoyer email de validation à l'employé
            try {
                $employeeName = $order['employee_name'];
                $employees = $this->loadEmployees();
                $employee = collect($employees)->firstWhere('id', $order['employee_id']);

                if ($employee && isset($employee['email'])) {
                    Mail::to($employee['email'])->send(new OrderValidated(
                        $employeeName,
                        $restaurantName,
                        $order['total_amount'],
                        $deliveryLocation
                    ));
                    Log::info("Email de validation commande envoyé à: {$employee['email']}");
                }

                // Envoyer notification WhatsApp (GRATUIT)
                if ($employee) {
                    // Enrichir l'order avec les infos complètes pour WhatsApp
                    $order['restaurant_name'] = $restaurantName;
                    $order['delivery_location'] = $deliveryLocation;

                    $whatsapp = new WhatsAppService();
                    $whatsapp->notifyOrderValidated($order, $employee);
                }
            } catch (\Exception $e) {
                Log::error("Erreur envoi email validation commande: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Commande validée avec succès',
                'data' => $orders[$orderIndex]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur validation commande: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Rejeter une commande
     */
    public function rejectOrder(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'reason' => 'nullable|string|max:500'
            ]);

            $restaurantId = $request->header('X-User-Restaurant-Id');
            $userId = $request->header('X-User-Id', '0');

            // Récupérer le nom depuis la base de données pour éviter les problèmes d'encodage
            $user = \App\Models\User::find($userId);
            $rejectedBy = $user ? $user->name : 'Gestionnaire';

            Log::info('Rejet commande - User ID: ' . $userId . ' -> Nom depuis BDD: ' . $rejectedBy);

            $orders = $this->loadOrders();
            $orderIndex = collect($orders)->search(function ($order) use ($id) {
                return $order['id'] === $id;
            });

            if ($orderIndex === false) {
                return response()->json(['error' => 'Commande non trouvée'], 404);
            }

            $order = $orders[$orderIndex];

            // Vérifier que la commande appartient au restaurant
            if ($order['restaurant_id'] !== $restaurantId) {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            // Mettre à jour le statut
            $orders[$orderIndex]['status'] = 'rejected';
            $orders[$orderIndex]['rejected_by'] = $rejectedBy;
            $orders[$orderIndex]['rejected_at'] = now()->toDateTimeString();
            $orders[$orderIndex]['rejection_reason'] = $validated['reason'] ?? 'Aucune raison spécifiée';
            $orders[$orderIndex]['updated_at'] = now()->toDateTimeString();

            $this->saveOrders($orders);

            // Rembourser l'employé directement dans MySQL
            $employee = \App\Models\Employee::find($order['employee_id']);

            if ($employee) {
                $employee->increment('ticket_balance', $order['total_amount']);
                Log::info('Remboursement de ' . $order['total_amount'] . 'F à ' . $employee->name . ' (Nouveau solde: ' . $employee->ticket_balance . 'F)');
            } else {
                Log::warning('Employé non trouvé pour remboursement: ' . $order['employee_id']);
            }

            Log::info('Commande rejetée: ' . $id . ' par ' . $rejectedBy);

            // Récupérer le nom du restaurant (priorité aux données de la commande)
            $restaurantName = 'Restaurant'; // Valeur par défaut

            // Priorité 1: Utiliser restaurant_name des items de la commande
            if (!empty($order['items'][0]['restaurant_name'])) {
                $restaurantName = $order['items'][0]['restaurant_name'];
            } else {
                // Priorité 2: Chercher dans restaurants.json (fallback)
                $restaurants = $this->loadRestaurants();
                $restaurant = collect($restaurants)->firstWhere('id', $order['restaurant_id']);
                if ($restaurant && !empty($restaurant['name'])) {
                    $restaurantName = $restaurant['name'];
                }
            }

            // Notification pour l'employé : commande rejetée
            $rejectionReason = $orders[$orderIndex]['rejection_reason'];
            NotificationController::createNotification([
                'type' => 'warning',
                'title' => 'Commande rejetée ❌',
                'message' => "Votre commande chez $restaurantName d'un montant de {$order['total_amount']}F a été rejetée. Raison: $rejectionReason. Votre solde de tickets a été remboursé.",
                'user_id' => $order['employee_id'],
                'action_url' => '/employee/orders',
                'metadata' => [
                    'order_id' => $id,
                    'restaurant_name' => $restaurantName,
                    'total_amount' => $order['total_amount'],
                    'rejection_reason' => $rejectionReason,
                    'rejected_by' => $rejectedBy,
                    'rejected_at' => $orders[$orderIndex]['rejected_at'],
                    'refunded' => true
                ]
            ]);

            // Charger les informations du lieu de livraison si spécifié
            $deliveryLocation = null;
            if (isset($order['delivery_location_id'])) {
                $location = DeliveryLocation::find($order['delivery_location_id']);
                if ($location) {
                    $deliveryLocation = [
                        'name' => $location->name,
                        'address' => $location->address,
                        'building' => $location->building,
                        'floor' => $location->floor,
                        'instructions' => $location->instructions,
                    ];
                }
            }

            // Envoyer email de rejet à l'employé
            try {
                $employeeName = $order['employee_name'];
                $employees = $this->loadEmployees();
                $employee = collect($employees)->firstWhere('id', $order['employee_id']);

                if ($employee && isset($employee['email'])) {
                    Mail::to($employee['email'])->send(new OrderRejected(
                        $employeeName,
                        $restaurantName,
                        $order['total_amount'],
                        $rejectionReason,
                        $deliveryLocation
                    ));
                    Log::info("Email de rejet commande envoyé à: {$employee['email']}");
                }

                // Envoyer notification WhatsApp (GRATUIT)
                if ($employee) {
                    // Enrichir l'order avec les infos complètes pour WhatsApp
                    $orders[$orderIndex]['restaurant_name'] = $restaurantName;
                    $orders[$orderIndex]['delivery_location'] = $deliveryLocation;

                    $whatsapp = new WhatsAppService();
                    $whatsapp->notifyOrderRejected($orders[$orderIndex], $employee);
                }
            } catch (\Exception $e) {
                Log::error("Erreur envoi email rejet commande: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Commande rejetée et employé remboursé',
                'data' => $orders[$orderIndex]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur rejet commande: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Charger les commandes
     */
    private function loadOrders()
    {
        return \App\Models\Order::all()->toArray();
    }

    /**
     * Sauvegarder les commandes
     */
    private function saveOrders($orders)
    {
        foreach ($orders as $order) {
            \App\Models\Order::updateOrCreate(['id' => $order['id']], $order);
        }
    }

    /**
     * Charger les employés
     */
    private function loadEmployees()
    {
        return \App\Models\Employee::all()->toArray();
    }

    /**
     * Sauvegarder les employés (MySQL gère automatiquement)
     */
    private function saveEmployees($employees)
    {
        // Avec MySQL, la sauvegarde est automatique via Eloquent
        // Cette méthode est conservée pour compatibilité mais ne fait rien
    }

    /**
     * Charger les restaurants (désormais depuis la BDD)
     */
    private function loadRestaurants()
    {
        return Restaurant::all()->toArray();
    }

    /**
     * Charger les plats (désormais depuis la BDD)
     */
    private function loadMenuItems()
    {
        return MenuItem::all()->toArray();
    }

    /**
     * Mettre à jour l'utilisation des tickets dans les souches (MySQL)
     */
    private function updateTicketBatchUsage($employeeId, $amount)
    {
        // Trouver la première souche active de l'employé
        $batch = \App\Models\TicketBatch::where('employee_id', $employeeId)
            ->where('status', 'active')
            ->orderBy('created_at', 'asc')
            ->first();

        if (!$batch) {
            return; // Pas de souches à mettre à jour
        }

        // Calculer combien de tickets ont été utilisés
        $ticketValue = $batch->ticket_value ?? 500;
        $ticketsUsed = intval($amount / $ticketValue);

        // Mettre à jour les compteurs
        $batch->increment('used_tickets', $ticketsUsed);
        $batch->decrement('remaining_tickets', $ticketsUsed);

        Log::info("Souche {$batch->id} mise à jour: +{$ticketsUsed} tickets utilisés");
    }

    /**
     * Nettoyer le nom d'utilisateur pour éviter les problèmes d'encodage
     */
    private function cleanUserName($name)
    {
        // Utiliser iconv pour translittérer les caractères accentués en ASCII
        $cleanName = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);

        // Si iconv échoue, essayer une méthode de remplacement manuelle
        if ($cleanName === false || empty($cleanName)) {
            $transliterations = [
                'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
                'à' => 'a', 'â' => 'a', 'ä' => 'a',
                'ô' => 'o', 'ö' => 'o',
                'û' => 'u', 'ù' => 'u', 'ü' => 'u',
                'î' => 'i', 'ï' => 'i',
                'ç' => 'c',
                'É' => 'E', 'È' => 'E', 'Ê' => 'E', 'Ë' => 'E',
                'À' => 'A', 'Â' => 'A', 'Ä' => 'A',
                'Ô' => 'O', 'Ö' => 'O',
                'Û' => 'U', 'Ù' => 'U', 'Ü' => 'U',
                'Î' => 'I', 'Ï' => 'I',
                'Ç' => 'C',
            ];
            $cleanName = strtr($name, $transliterations);
        }

        // Enlever tous les caractères non-ASCII restants
        $cleanName = preg_replace('/[^\x20-\x7E]/', '', $cleanName);

        // Si le nettoyage échoue complètement, retourner un nom par défaut
        if (empty($cleanName)) {
            return 'Gestionnaire';
        }

        return trim($cleanName);
    }
}
