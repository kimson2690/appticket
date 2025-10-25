<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class EmployeeRestaurantController extends Controller
{
    private $partnershipsFile = 'company_restaurant_partnerships.json';

    /**
     * Récupérer les restaurants partenaires de l'entreprise de l'employé
     */
    public function getAvailableRestaurants(Request $request)
    {
        try {
            $companyId = $request->header('X-User-Company-Id');
            
            if (!$companyId) {
                Log::warning('Company ID manquant pour l\'employé');
                // Si pas de company_id, retourner tableau vide (pas de restaurants accessibles)
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Charger les partenariats
            $partnerships = $this->loadPartnerships();
            
            // Filtrer les partenariats actifs de cette entreprise
            $companyPartnerships = array_filter($partnerships, function($p) use ($companyId) {
                return (string)$p['company_id'] === (string)$companyId && 
                       isset($p['status']) && 
                       $p['status'] === 'active';
            });

            // Récupérer les IDs des restaurants partenaires
            $restaurantIds = array_map(function($p) {
                return (string)$p['restaurant_id'];
            }, $companyPartnerships);

            Log::info("Employé company_id: $companyId - Restaurants partenaires: " . json_encode($restaurantIds));

            // Si aucun partenariat, retourner tableau vide
            if (empty($restaurantIds)) {
                Log::info("Aucun restaurant partenaire pour l'entreprise $companyId");
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            // Charger les restaurants partenaires depuis la base de données
            $restaurants = Restaurant::whereIn('id', $restaurantIds)
                ->where('status', 'active')
                ->get()
                ->map(function($restaurant) {
                    return [
                        'id' => (string) $restaurant->id,
                        'name' => $restaurant->name,
                        'cuisine_type' => $restaurant->cuisine_type,
                        'address' => $restaurant->address,
                        'phone' => $restaurant->phone,
                        'email' => $restaurant->email,
                        'status' => $restaurant->status,
                        'average_rating' => $restaurant->average_rating ?? 0,
                        'delivery_fee' => $restaurant->delivery_fee ?? 0,
                        'minimum_order' => $restaurant->minimum_order ?? 0,
                        'is_active' => true
                    ];
                })
                ->toArray();

            Log::info("Restaurants retournés: " . count($restaurants));

            return response()->json([
                'success' => true,
                'data' => array_values($restaurants)
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des restaurants pour employé: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => 'Erreur serveur'
            ], 500);
        }
    }

    /**
     * Charger les partenariats depuis le fichier JSON
     */
    private function loadPartnerships()
    {
        if (!Storage::exists($this->partnershipsFile)) {
            Log::warning("Fichier de partenariats non trouvé: {$this->partnershipsFile}");
            return [];
        }

        $content = Storage::get($this->partnershipsFile);
        return json_decode($content, true) ?? [];
    }
}
