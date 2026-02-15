<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ReviewItem;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\Employee;
use App\Http\Controllers\Admin\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    /**
     * Récupérer les commandes en attente de notation (confirmées, < 48h, non notées)
     */
    public function pendingReviews(Request $request)
    {
        try {
            $employeeId = $request->header('X-User-Id');

            if (!$employeeId) {
                return response()->json(['success' => false, 'message' => 'Utilisateur non identifié'], 401);
            }

            // Commandes confirmées dans les 48 dernières heures, sans avis
            $orders = Order::where('employee_id', $employeeId)
                ->where('status', 'confirmed')
                ->where('confirmed_at', '>=', now()->subHours(48))
                ->whereDoesntHave('review')
                ->orderBy('confirmed_at', 'desc')
                ->get();

            // Enrichir avec le nom du restaurant
            $enrichedOrders = $orders->map(function ($order) {
                $restaurant = Restaurant::find($order->restaurant_id);
                return [
                    'id' => $order->id,
                    'restaurant_id' => $order->restaurant_id,
                    'restaurant_name' => $restaurant ? $restaurant->name : 'Restaurant',
                    'items' => $order->items,
                    'total_amount' => $order->total_amount,
                    'confirmed_at' => $order->confirmed_at,
                    'created_at' => $order->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $enrichedOrders->values()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur pendingReviews: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Soumettre un avis pour une commande
     */
    public function store(Request $request)
    {
        try {
            $employeeId = $request->header('X-User-Id');

            if (!$employeeId) {
                return response()->json(['success' => false, 'message' => 'Utilisateur non identifié'], 401);
            }

            $validated = $request->validate([
                'order_id' => 'required|string',
                'overall_rating' => 'required|integer|min:1|max:5',
                'food_rating' => 'nullable|integer|min:1|max:5',
                'service_rating' => 'nullable|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
                'is_anonymous' => 'boolean',
                'items' => 'nullable|array',
                'items.*.menu_item_id' => 'required_with:items|string',
                'items.*.menu_item_name' => 'required_with:items|string',
                'items.*.rating' => 'required_with:items|integer|min:1|max:5',
                'items.*.comment' => 'nullable|string|max:500',
            ]);

            // Vérifier que la commande existe et appartient à l'employé
            $order = Order::where('id', $validated['order_id'])
                ->where('employee_id', $employeeId)
                ->where('status', 'confirmed')
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Commande non trouvée ou non éligible à la notation'
                ], 404);
            }

            // Vérifier qu'un avis n'existe pas déjà
            if (Review::where('order_id', $validated['order_id'])->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Un avis existe déjà pour cette commande'
                ], 409);
            }

            // Vérifier la fenêtre de 48h
            if ($order->confirmed_at && $order->confirmed_at->lt(now()->subHours(48))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le délai de notation de 48h est dépassé'
                ], 422);
            }

            DB::beginTransaction();

            // Créer l'avis
            $review = Review::create([
                'order_id' => $validated['order_id'],
                'employee_id' => $employeeId,
                'restaurant_id' => $order->restaurant_id,
                'overall_rating' => $validated['overall_rating'],
                'food_rating' => $validated['food_rating'] ?? null,
                'service_rating' => $validated['service_rating'] ?? null,
                'comment' => $validated['comment'] ?? null,
                'is_anonymous' => $validated['is_anonymous'] ?? false,
            ]);

            // Créer les avis par plat si fournis
            if (!empty($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    ReviewItem::create([
                        'review_id' => $review->id,
                        'menu_item_id' => $item['menu_item_id'],
                        'menu_item_name' => $item['menu_item_name'],
                        'rating' => $item['rating'],
                        'comment' => $item['comment'] ?? null,
                    ]);
                }
            }

            // Mettre à jour la moyenne du restaurant
            $this->updateRestaurantRating($order->restaurant_id);

            DB::commit();

            // Notifier le gestionnaire du restaurant
            $restaurant = Restaurant::find($order->restaurant_id);
            $restaurantName = $restaurant ? $restaurant->name : 'Restaurant';
            $stars = str_repeat('⭐', $validated['overall_rating']);
            $isAnon = $validated['is_anonymous'] ?? false;

            if ($isAnon) {
                $reviewerLabel = 'Un employé';
            } else {
                $employee = Employee::find($employeeId);
                $reviewerLabel = $employee ? $employee->name : 'Un employé';
            }

            $notifType = $validated['overall_rating'] >= 4 ? 'success' : ($validated['overall_rating'] >= 3 ? 'info' : 'warning');
            $commentPreview = !empty($validated['comment']) ? ' : "' . mb_substr($validated['comment'], 0, 100) . '"' : '';

            NotificationController::createNotification([
                'type' => $notifType,
                'title' => "Nouvel avis reçu {$stars}",
                'message' => "{$reviewerLabel} a noté votre restaurant {$validated['overall_rating']}/5{$commentPreview}",
                'restaurant_id' => $order->restaurant_id,
                'role' => 'Gestionnaire Restaurant',
                'action_url' => '/admin/restaurant-reviews',
                'metadata' => [
                    'review_id' => $review->id,
                    'overall_rating' => $validated['overall_rating'],
                    'type' => 'new_review'
                ]
            ]);

            Log::info("Avis créé pour commande {$validated['order_id']} par employé {$employeeId}", [
                'overall_rating' => $validated['overall_rating'],
                'restaurant_id' => $order->restaurant_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Merci pour votre avis !',
                'data' => $review->load('items')->toArray()
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création avis: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer un avis spécifique (par order_id)
     */
    public function showByOrder(Request $request, $orderId)
    {
        try {
            $employeeId = $request->header('X-User-Id');

            $review = Review::with('items')
                ->where('order_id', $orderId)
                ->where('employee_id', $employeeId)
                ->first();

            if (!$review) {
                return response()->json([
                    'success' => false,
                    'message' => 'Avis non trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $review->toArray()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur showByOrder: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer tous mes avis
     */
    public function myReviews(Request $request)
    {
        try {
            $employeeId = $request->header('X-User-Id');

            $reviews = Review::with('items')
                ->where('employee_id', $employeeId)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($review) {
                    $restaurant = Restaurant::find($review->restaurant_id);
                    $reviewArray = $review->toArray();
                    $reviewArray['restaurant_name'] = $restaurant ? $restaurant->name : 'Restaurant';
                    return $reviewArray;
                });

            return response()->json([
                'success' => true,
                'data' => $reviews
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur myReviews: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Recalculer la moyenne d'un restaurant
     */
    private function updateRestaurantRating(int $restaurantId): void
    {
        $stats = Review::where('restaurant_id', $restaurantId)
            ->selectRaw('AVG(overall_rating) as avg_rating, COUNT(*) as total_reviews')
            ->first();

        Restaurant::where('id', $restaurantId)->update([
            'average_rating' => round($stats->avg_rating, 2),
            'total_reviews' => $stats->total_reviews,
        ]);

        Log::info("Restaurant {$restaurantId} - Nouvelle moyenne: {$stats->avg_rating} ({$stats->total_reviews} avis)");
    }
}
