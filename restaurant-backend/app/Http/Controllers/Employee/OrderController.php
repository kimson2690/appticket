<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
            $validated = $request->validate([
                'restaurant_id' => 'required|string',
                'items' => 'required|array|min:1',
                'items.*.item_id' => 'required|string',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.price' => 'required|numeric|min:0',
                'delivery_address' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            $userId = $request->header('X-User-Id');
            $userName = $request->header('X-User-Name');

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
        $json = json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
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
        $json = json_encode($employees, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
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
}
