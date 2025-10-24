<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Admin\NotificationController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderConfirmation;
use App\Mail\NewOrderReceived;

class OrderController extends Controller
{
    private $ordersFile = 'orders.json';
    private $employeesFile = 'employees.json';
    private $restaurantsFile = 'restaurants.json';
    private $menuItemsFile = 'menu_items.json';

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
            $employees = $this->loadEmployees();
            $employee = collect($employees)->firstWhere('id', $userId);

            if (!$employee) {
                return response()->json(['error' => 'Employé non trouvé'], 404);
            }

            // Calculer le montant total
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['price'] * $item['quantity'];
            }

            // Vérifier le solde de tickets
            $ticketBalance = $employee['ticket_balance'] ?? 0;
            if ($ticketBalance < $totalAmount) {
                return response()->json([
                    'error' => 'Solde de tickets insuffisant',
                    'required' => $totalAmount,
                    'available' => $ticketBalance
                ], 400);
            }

            // Créer la commande
            $orders = $this->loadOrders();
            $orderId = 'order_' . time() . '_' . rand(1000, 9999);

            $order = [
                'id' => $orderId,
                'employee_id' => $userId,
                'employee_name' => $userName,
                'restaurant_id' => $validated['restaurant_id'],
                'items' => $validated['items'],
                'total_amount' => $totalAmount,
                'ticket_amount_used' => $totalAmount,
                'status' => 'pending',
                'delivery_address' => $validated['delivery_address'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'created_at' => now()->toDateTimeString(),
                'updated_at' => now()->toDateTimeString(),
            ];

            $orders[] = $order;
            $this->saveOrders($orders);

            // Déduire le montant du solde de tickets
            $employeeIndex = collect($employees)->search(function ($emp) use ($userId) {
                return $emp['id'] === $userId;
            });

            if ($employeeIndex !== false) {
                $employees[$employeeIndex]['ticket_balance'] -= $totalAmount;
                $this->saveEmployees($employees);
            }

            Log::info('Commande créée: ' . $orderId . ' pour ' . $userName . ' - Montant: ' . $totalAmount . 'F');

            // Récupérer les infos du restaurant
            $restaurants = $this->loadRestaurants();
            $restaurant = collect($restaurants)->firstWhere('id', $validated['restaurant_id']);
            $restaurantName = $restaurant['name'] ?? 'Restaurant';

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
            
            // Envoyer email de confirmation à l'employé
            try {
                $orderItemsForEmail = array_map(function($item) {
                    return [
                        'name' => $item['name'] ?? 'Article',
                        'quantity' => $item['quantity'],
                        'price' => $item['price'] * $item['quantity']
                    ];
                }, $validated['items']);
                
                Mail::to($employee['email'])->send(new OrderConfirmation(
                    $userName, 
                    $restaurantName, 
                    $totalAmount,
                    $orderItemsForEmail
                ));
                Log::info("Email de confirmation commande envoyé à: {$employee['email']}");
            } catch (\Exception $e) {
                Log::error("Erreur envoi email confirmation commande: " . $e->getMessage());
            }
            
            // Envoyer email au gestionnaire du restaurant
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
                    
                    Mail::to($manager->email)->send(new NewOrderReceived(
                        $userName,
                        $restaurantName,
                        $totalAmount,
                        $orderItemsForEmail
                    ));
                    Log::info("Email de nouvelle commande envoyé au restaurant: {$manager->email}");
                } else {
                    Log::warning("Aucun gestionnaire trouvé pour le restaurant {$validated['restaurant_id']}");
                }
            } catch (\Exception $e) {
                Log::error("Erreur envoi email au gestionnaire restaurant: " . $e->getMessage());
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

            $orders = $this->loadOrders();
            $restaurants = $this->loadRestaurants();

            // Créer un index des restaurants
            $restaurantsById = collect($restaurants)->keyBy('id')->toArray();

            // Filtrer et enrichir les commandes
            $employeeOrders = collect($orders)
                ->where('employee_id', $userId)
                ->map(function ($order) use ($restaurantsById) {
                    if (isset($restaurantsById[$order['restaurant_id']])) {
                        $order['restaurant'] = $restaurantsById[$order['restaurant_id']];
                    }
                    return $order;
                })
                ->sortByDesc('created_at')
                ->values()
                ->all();

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

            $orders = $this->loadOrders();
            $order = collect($orders)->firstWhere('id', $id);

            if (!$order) {
                return response()->json(['error' => 'Commande non trouvée'], 404);
            }

            // Vérifier que la commande appartient à l'employé
            if ($order['employee_id'] !== $userId) {
                return response()->json(['error' => 'Accès non autorisé'], 403);
            }

            // Enrichir avec les données du restaurant
            $restaurants = $this->loadRestaurants();
            $restaurant = collect($restaurants)->firstWhere('id', $order['restaurant_id']);
            if ($restaurant) {
                $order['restaurant'] = $restaurant;
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

    /**
     * Charger les commandes
     */
    private function loadOrders()
    {
        $filePath = storage_path('app/' . $this->ordersFile);
        
        if (!file_exists($filePath)) {
            return [];
        }

        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }

    /**
     * Sauvegarder les commandes
     */
    private function saveOrders($orders)
    {
        $filePath = storage_path('app/' . $this->ordersFile);
        
        // Nettoyer les caractères UTF-8 invalides
        $cleanedOrders = $this->cleanUtf8Recursively($orders);
        
        $json = json_encode($cleanedOrders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        if ($json === false) {
            Log::error('Erreur encodage JSON commandes: ' . json_last_error_msg());
            throw new \Exception('Impossible d\'encoder les données en JSON');
        }
        
        file_put_contents($filePath, $json);
    }

    /**
     * Charger les employés
     */
    private function loadEmployees()
    {
        $filePath = storage_path('app/' . $this->employeesFile);
        
        if (!file_exists($filePath)) {
            return [];
        }

        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }

    /**
     * Sauvegarder les employés
     */
    private function saveEmployees($employees)
    {
        $filePath = storage_path('app/' . $this->employeesFile);
        
        // Nettoyer les caractères UTF-8 invalides
        $cleanedEmployees = $this->cleanUtf8Recursively($employees);
        
        $json = json_encode($cleanedEmployees, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        if ($json === false) {
            Log::error('Erreur encodage JSON employés: ' . json_last_error_msg());
            throw new \Exception('Impossible d\'encoder les données en JSON');
        }
        
        file_put_contents($filePath, $json);
    }

    /**
     * Charger les restaurants
     */
    private function loadRestaurants()
    {
        $filePath = storage_path('app/' . $this->restaurantsFile);
        
        if (!file_exists($filePath)) {
            return [];
        }

        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }

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
