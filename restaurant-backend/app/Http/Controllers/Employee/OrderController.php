<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\NotificationController;
use App\Models\User;
use App\Models\Employee;
use App\Models\Order;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderConfirmation;
use App\Mail\NewOrderReceived;
use App\Models\DeliveryLocation;
use App\Helpers\EmailPriority;

class OrderController extends Controller
{

    /**
     * Créer une nouvelle commande
     */
    public function store(Request $request)
    {
        try {
            // Nettoyer toutes les données de la requête AVANT validation
            $cleanedInput = $this->cleanUtf8Recursively($request->all());
            $request->merge($cleanedInput);

            $validated = $request->validate([
                'restaurant_id' => 'required|string',
                'items' => 'required|array|min:1',
                'items.*.item_id' => 'required|string',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.price' => 'required|numeric|min:0',
                'items.*.name' => 'nullable|string',
                'items.*.restaurant_name' => 'nullable|string',
                'delivery_location_id' => 'nullable|integer',
                'delivery_address' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $userId = $request->header('X-User-Id');
            $userNameRaw = $request->header('X-User-Name');

            // Nettoyer le nom d'utilisateur immédiatement
            $userName = mb_convert_encoding($userNameRaw ?? '', 'UTF-8', 'UTF-8');

            if (!$userId) {
                return response()->json(['error' => 'User ID manquant'], 401);
            }

            // Charger l'employé pour vérifier le solde
            $employee = Employee::find($userId);

            if (!$employee) {
                return response()->json(['error' => 'Employé non trouvé'], 404);
            }

            // Calculer le montant total
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['price'] * $item['quantity'];
            }

            // Vérifier le solde de tickets
            $ticketBalance = $employee->ticket_balance ?? 0;
            if ($ticketBalance < $totalAmount) {
                return response()->json([
                    'error' => 'Solde de tickets insuffisant',
                    'required' => $totalAmount,
                    'available' => $ticketBalance
                ], 400);
            }

            // Créer la commande via Eloquent
            $orderId = 'order_' . time() . '_' . rand(1000, 9999);

            $order = Order::create([
                'id' => $orderId,
                'employee_id' => $userId,
                'employee_name' => $userName,
                'restaurant_id' => $validated['restaurant_id'],
                'items' => $validated['items'],
                'total_amount' => $totalAmount,
                'ticket_amount_used' => $totalAmount,
                'status' => 'pending',
                'delivery_location_id' => $validated['delivery_location_id'] ?? null,
                'delivery_address' => $validated['delivery_address'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Déduire le montant du solde de tickets
            $employee->ticket_balance -= $totalAmount;
            $employee->save();

            Log::info('Commande créée: ' . $orderId . ' pour ' . $userName . ' - Montant: ' . $totalAmount . 'F');

            // Récupérer le nom du restaurant (priorité au nom envoyé par le frontend)
            $restaurantName = 'Restaurant'; // Valeur par défaut

            // Si restaurant_name est fourni dans les items, l'utiliser
            if (!empty($validated['items'][0]['restaurant_name'])) {
                $restaurantName = $validated['items'][0]['restaurant_name'];
            } else {
                // Sinon, chercher dans la BDD
                $restaurant = Restaurant::find($validated['restaurant_id']);
                if ($restaurant) {
                    $restaurantName = $restaurant->name;
                }
            }

            // Créer une notification pour l'employé (confirmation de commande)
            NotificationController::createNotification([
                'type' => 'success',
                'title' => 'Commande confirmée',
                'message' => "Votre commande chez $restaurantName d'un montant de {$totalAmount}F a été créée avec succès.",
                'user_id' => $userId,
                'action_url' => '/employee/orders',
                'metadata' => [
                    'order_id' => $orderId,
                    'restaurant_name' => $restaurantName,
                    'total_amount' => $totalAmount,
                    'items_count' => count($validated['items'])
                ]
            ]);

            // Créer une notification pour le gestionnaire du restaurant
            // Utilise le filtrage par rôle et restaurant_id au lieu de user_id
            NotificationController::createNotification([
                'type' => 'info',
                'title' => 'Nouvelle commande',
                'message' => "$userName a passé une commande de {$totalAmount}F chez $restaurantName.",
                'role' => 'Gestionnaire Restaurant',
                'restaurant_id' => $validated['restaurant_id'],
                'action_url' => '/admin/orders',
                'metadata' => [
                    'order_id' => $orderId,
                    'employee_name' => $userName,
                    'employee_id' => $userId,
                    'restaurant_name' => $restaurantName,
                    'total_amount' => $totalAmount,
                    'items_count' => count($validated['items'])
                ]
            ]);

            // Charger les informations du lieu de livraison si spécifié
            $deliveryLocation = null;
            if (isset($validated['delivery_location_id'])) {
                $location = DeliveryLocation::find($validated['delivery_location_id']);
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

            // Envoyer email de confirmation à l'employé
            try {
                $orderItemsForEmail = array_map(function($item) {
                    return [
                        'name' => $item['name'] ?? 'Article',
                        'quantity' => $item['quantity'],
                        'price' => $item['price'] * $item['quantity']
                    ];
                }, $validated['items']);

                $mailable = new OrderConfirmation(
                    $userName,
                    $restaurantName,
                    $totalAmount,
                    $orderItemsForEmail,
                    $deliveryLocation
                );
                $mailable->onQueue(EmailPriority::HIGH);
                Mail::to($employee->email)->queue($mailable);
                Log::info("Email de confirmation commande envoyé à: {$employee->email}");
            } catch (\Exception $e) {
                Log::error("Erreur envoi email confirmation commande: " . $e->getMessage());
            }

            // Envoyer email et WhatsApp au gestionnaire du restaurant
            try {
                // Récupérer le gestionnaire du restaurant depuis la BD
                $manager = User::where('restaurant_id', $validated['restaurant_id'])
                              ->whereHas('role', function($query) {
                                  $query->where('name', 'Gestionnaire Restaurant');
                              })
                              ->first();

                if ($manager && $manager->email) {
                    $orderItemsForEmail = array_map(function($item) {
                        return [
                            'name' => $item['name'] ?? 'Article',
                            'quantity' => $item['quantity']
                        ];
                    }, $validated['items']);

                    // Envoyer email
                    $mailable = new NewOrderReceived(
                        $userName,
                        $restaurantName,
                        $totalAmount,
                        $orderItemsForEmail,
                        $deliveryLocation
                    );
                    $mailable->onQueue(EmailPriority::HIGH);
                    Mail::to($manager->email)->queue($mailable);
                    Log::info("Email de nouvelle commande envoyé au restaurant: {$manager->email}");

                    // Envoyer notification WhatsApp au gestionnaire
                    if (env('WHATSAPP_ENABLED', false) && $manager->phone) {
                        try {
                            $whatsappService = new \App\Services\WhatsAppService();

                            // Préparer les données pour le template
                            $whatsappData = [
                                'restaurant_name' => $restaurantName,
                                'employee_name' => $userName,
                                'company_name' => $employee['company_name'] ?? 'Entreprise',
                                'items' => array_map(function($item) {
                                    return [
                                        'name' => $item['name'] ?? 'Article',
                                        'quantity' => $item['quantity']
                                    ];
                                }, $validated['items']),
                                'total_amount' => number_format($totalAmount, 0, '', ' '),
                                'delivery_location' => $deliveryLocation['name'] ?? 'Sur place',
                                'notes' => $validated['notes'] ?? null,
                                'order_id' => $orderId
                            ];

                            // Créer un objet manager compatible
                            $managerData = [
                                'phone' => $manager->phone,
                                'name' => $manager->name
                            ];

                            $whatsappService->sendTemplate($manager->phone, 'new_order_restaurant', $whatsappData);
                            Log::info("Notification WhatsApp envoyée au gestionnaire du restaurant: {$manager->phone}");
                        } catch (\Exception $e) {
                            Log::error("Erreur envoi WhatsApp au gestionnaire restaurant: " . $e->getMessage());
                        }
                    }
                } else {
                    Log::warning("Aucun gestionnaire trouvé pour le restaurant {$validated['restaurant_id']}");
                }
            } catch (\Exception $e) {
                Log::error("Erreur envoi notifications au gestionnaire restaurant: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Commande créée avec succès',
                'data' => $order
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur création commande: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Récupérer les commandes de l'employé
     */
    public function index(Request $request)
    {
        try {
            $userId = $request->header('X-User-Id');

            if (!$userId) {
                return response()->json(['error' => 'User ID manquant'], 401);
            }

            // Récupérer les commandes avec la relation restaurant via Eloquent
            $employeeOrders = Order::where('employee_id', $userId)
                ->with(['restaurant', 'deliveryLocation'])
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $employeeOrders
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération commandes: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer le détail d'une commande
     */
    public function show(Request $request, $id)
    {
        try {
            $userId = $request->header('X-User-Id');

            if (!$userId) {
                return response()->json(['error' => 'User ID manquant'], 401);
            }

            $order = Order::with('restaurant')->find($id);

            if (!$order) {
                return response()->json(['error' => 'Commande non trouvée'], 404);
            }

            // Vérifier que la commande appartient à l'employé
            if ($order->employee_id !== $userId) {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $order
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération commande: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    // Les méthodes de chargement JSON ont été supprimées - utilisation d'Eloquent à la place

    /**
     * Nettoyer récursivement les caractères UTF-8 invalides
     */
    private function cleanUtf8Recursively($data)
    {
        if ($data === null) {
            return null;
        }

        if (is_array($data)) {
            $cleaned = [];
            foreach ($data as $key => $value) {
                $cleanedKey = is_string($key) ? mb_convert_encoding($key, 'UTF-8', 'UTF-8') : $key;
                $cleaned[$cleanedKey] = $this->cleanUtf8Recursively($value);
            }
            return $cleaned;
        }

        if (is_string($data)) {
            // Supprimer les caractères UTF-8 invalides et nettoyer
            $cleaned = mb_convert_encoding($data, 'UTF-8', 'UTF-8');
            // Supprimer les caractères de contrôle invisibles
            $cleaned = preg_replace('/[\x00-\x1F\x7F]/u', '', $cleaned);
            return $cleaned;
        }

        return $data;
    }
}
