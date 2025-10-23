<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OrderManagementController extends Controller
{
    private $ordersFile = 'orders.json';
    private $restaurantsFile = 'restaurants.json';
    private $employeesFile = 'employees.json';
    private $menuItemsFile = 'private/menu_items.json';

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
            $menuItems = $this->loadMenuItems();

            // Créer des index
            $employeesById = collect($employees)->keyBy('id')->toArray();
            $menuItemsById = collect($menuItems)->keyBy('id')->toArray();

            // Filtrer les commandes du restaurant
            $restaurantOrders = collect($orders);
            
            if ($userRole !== 'Administrateur') {
                $restaurantOrders = $restaurantOrders->where('restaurant_id', $restaurantId);
            }

            // Enrichir les commandes
            $enrichedOrders = $restaurantOrders->map(function ($order) use ($employeesById, $menuItemsById) {
                // Ajouter les infos de l'employé
                if (isset($employeesById[$order['employee_id']])) {
                    $order['employee'] = $employeesById[$order['employee_id']];
                }

                // Enrichir les items avec les détails des plats
                if (isset($order['items'])) {
                    $order['items'] = array_map(function ($item) use ($menuItemsById) {
                        if (isset($menuItemsById[$item['item_id']])) {
                            $item['details'] = $menuItemsById[$item['item_id']];
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
            $userNameRaw = $request->header('X-User-Name');
            
            // Nettoyer le nom d'utilisateur dès réception
            $userName = $this->cleanUtf8Recursively($userNameRaw);

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
            $orders[$orderIndex]['confirmed_by'] = $userName;
            $orders[$orderIndex]['confirmed_at'] = now()->toDateTimeString();
            $orders[$orderIndex]['updated_at'] = now()->toDateTimeString();

            $this->saveOrders($orders);

            Log::info('Commande validée: ' . $id . ' par ' . $userName);

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
            $userNameRaw = $request->header('X-User-Name');
            
            // Nettoyer le nom d'utilisateur dès réception
            $userName = $this->cleanUtf8Recursively($userNameRaw);

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
            $orders[$orderIndex]['rejected_by'] = $userName;
            $orders[$orderIndex]['rejected_at'] = now()->toDateTimeString();
            $orders[$orderIndex]['rejection_reason'] = $validated['reason'] ?? 'Aucune raison spécifiée';
            $orders[$orderIndex]['updated_at'] = now()->toDateTimeString();

            $this->saveOrders($orders);

            // Rembourser l'employé
            $employees = $this->loadEmployees();
            $employeeIndex = collect($employees)->search(function ($emp) use ($order) {
                return $emp['id'] === $order['employee_id'];
            });

            if ($employeeIndex !== false) {
                $employees[$employeeIndex]['ticket_balance'] += $order['total_amount'];
                $this->saveEmployees($employees);
                Log::info('Remboursement de ' . $order['total_amount'] . 'F à ' . $order['employee_name']);
            }

            Log::info('Commande rejetée: ' . $id . ' par ' . $userName);

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
        $employees = json_decode($content, true) ?? [];
        
        // Nettoyer les données chargées pour éviter les problèmes d'encodage
        return $this->cleanUtf8Recursively($employees);
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
     * Charger les plats
     */
    private function loadMenuItems()
    {
        $filePath = storage_path('app/' . $this->menuItemsFile);
        
        if (!file_exists($filePath)) {
            return [];
        }

        $content = file_get_contents($filePath);
        return json_decode($content, true) ?? [];
    }
}
