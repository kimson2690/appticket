<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ReviewController extends Controller
{
    /**
     * Récupérer tous les avis du restaurant
     */
    public function index(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');

            if (!$restaurantId) {
                return response()->json(['success' => false, 'message' => 'Restaurant non identifié'], 401);
            }

            $reviews = Review::with('items')
                ->where('restaurant_id', $restaurantId)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($review) {
                    $reviewArray = $review->toArray();
                    
                    // Si l'avis est anonyme, masquer l'identité
                    if ($review->is_anonymous) {
                        $reviewArray['employee_id'] = null;
                        $reviewArray['employee_name'] = 'Anonyme';
                    } else {
                        $employee = \App\Models\Employee::find($review->employee_id);
                        $reviewArray['employee_name'] = $employee ? $employee->name : 'Employé';
                    }

                    return $reviewArray;
                });

            return response()->json([
                'success' => true,
                'data' => $reviews
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur récupération avis restaurant: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Statistiques des avis du restaurant
     */
    public function statistics(Request $request)
    {
        try {
            $restaurantId = $request->header('X-User-Restaurant-Id');

            if (!$restaurantId) {
                return response()->json(['success' => false, 'message' => 'Restaurant non identifié'], 401);
            }

            // Moyennes globales
            $globalStats = Review::where('restaurant_id', $restaurantId)
                ->selectRaw('
                    COUNT(*) as total_reviews,
                    AVG(overall_rating) as avg_overall,
                    AVG(food_rating) as avg_food,
                    AVG(service_rating) as avg_service
                ')
                ->first();

            // Distribution des notes (1-5)
            $ratingDistribution = Review::where('restaurant_id', $restaurantId)
                ->selectRaw('overall_rating, COUNT(*) as count')
                ->groupBy('overall_rating')
                ->orderBy('overall_rating', 'desc')
                ->pluck('count', 'overall_rating')
                ->toArray();

            // Compléter la distribution (1 à 5)
            $distribution = [];
            for ($i = 5; $i >= 1; $i--) {
                $distribution[$i] = $ratingDistribution[$i] ?? 0;
            }

            // Top plats (les mieux notés)
            $topItems = \App\Models\ReviewItem::whereHas('review', function ($q) use ($restaurantId) {
                    $q->where('restaurant_id', $restaurantId);
                })
                ->selectRaw('menu_item_name, AVG(rating) as avg_rating, COUNT(*) as review_count')
                ->groupBy('menu_item_name')
                ->having('review_count', '>=', 1)
                ->orderByDesc('avg_rating')
                ->limit(10)
                ->get();

            // Évolution mensuelle (6 derniers mois)
            $monthlyTrend = Review::where('restaurant_id', $restaurantId)
                ->where('created_at', '>=', now()->subMonths(6))
                ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, AVG(overall_rating) as avg_rating, COUNT(*) as count')
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            // Derniers avis
            $recentReviews = Review::with('items')
                ->where('restaurant_id', $restaurantId)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($review) {
                    $reviewArray = $review->toArray();
                    if ($review->is_anonymous) {
                        $reviewArray['employee_name'] = 'Anonyme';
                    } else {
                        $employee = \App\Models\Employee::find($review->employee_id);
                        $reviewArray['employee_name'] = $employee ? $employee->name : 'Employé';
                    }
                    return $reviewArray;
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'total_reviews' => (int) $globalStats->total_reviews,
                    'avg_overall' => round($globalStats->avg_overall ?? 0, 1),
                    'avg_food' => round($globalStats->avg_food ?? 0, 1),
                    'avg_service' => round($globalStats->avg_service ?? 0, 1),
                    'rating_distribution' => $distribution,
                    'top_items' => $topItems,
                    'monthly_trend' => $monthlyTrend,
                    'recent_reviews' => $recentReviews,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur statistiques avis: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Erreur serveur'], 500);
        }
    }
}
