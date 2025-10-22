<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class CompanyRestaurantController extends Controller
{
    private $partnershipsFile = 'company_restaurant_partnerships.json';

    /**
     * Récupérer les restaurants partenaires d'une entreprise
     */
    public function getPartnerRestaurants(Request $request)
    {
        try {
            $companyId = $request->header('X-User-Company-Id');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company ID manquant'], 400);
            }

            $partnerships = $this->loadPartnerships();
            
            // Filtrer les partenariats de cette entreprise
            $companyPartnerships = array_filter($partnerships, function($p) use ($companyId) {
                return $p['company_id'] === $companyId;
            });

            // Récupérer les IDs des restaurants partenaires
            $restaurantIds = array_map(function($p) {
                return $p['restaurant_id'];
            }, $companyPartnerships);

            return response()->json([
                'success' => true,
                'data' => [
                    'restaurant_ids' => array_values($restaurantIds),
                    'partnerships' => array_values($companyPartnerships)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des partenaires: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Récupérer tous les restaurants disponibles
     */
    public function getAvailableRestaurants(Request $request)
    {
        try {
            // Charger les restaurants depuis la BASE DE DONNÉES (vraies données modifiables)
            $restaurants = \App\Models\Restaurant::where('status', 'active')
                ->get()
                ->map(function($restaurant) {
                    return [
                        'id' => (string) $restaurant->id,
                        'name' => $restaurant->name,
                        'cuisine_type' => $restaurant->cuisine_type,
                        'address' => $restaurant->address,
                        'phone' => $restaurant->phone,
                        'email' => $restaurant->email,
                        'rating' => $restaurant->average_rating ?? 0,
                        'delivery_fee' => $restaurant->delivery_fee ?? 0,
                        'min_order' => $restaurant->minimum_order ?? 0,
                        'is_active' => true
                    ];
                })
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => array_values($restaurants)
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des restaurants: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Mettre à jour les restaurants partenaires d'une entreprise
     */
    public function updatePartnerRestaurants(Request $request)
    {
        try {
            $companyId = $request->header('X-User-Company-Id');
            $userName = $request->header('X-User-Name', 'Système');
            
            if (!$companyId) {
                return response()->json(['error' => 'Company ID manquant'], 400);
            }

            $validated = $request->validate([
                'restaurant_ids' => 'required|array',
                'restaurant_ids.*' => 'required|string'
            ]);

            $restaurantIds = $validated['restaurant_ids'];
            $partnerships = $this->loadPartnerships();

            // Supprimer les anciens partenariats de cette entreprise
            $partnerships = array_filter($partnerships, function($p) use ($companyId) {
                return $p['company_id'] !== $companyId;
            });

            // Ajouter les nouveaux partenariats
            foreach ($restaurantIds as $restaurantId) {
                $partnerships[] = [
                    'id' => 'partnership_' . time() . '_' . rand(1000, 9999),
                    'company_id' => $companyId,
                    'restaurant_id' => $restaurantId,
                    'status' => 'active',
                    'created_by' => $userName,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
            }

            $this->savePartnerships(array_values($partnerships));

            Log::info("Partenariats mis à jour pour l'entreprise $companyId par $userName");

            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'Partenariats mis à jour avec succès',
                    'count' => count($restaurantIds)
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour des partenariats: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur serveur'], 500);
        }
    }

    /**
     * Charger les partenariats depuis le fichier JSON
     */
    private function loadPartnerships()
    {
        if (!Storage::exists($this->partnershipsFile)) {
            return [];
        }

        $content = Storage::get($this->partnershipsFile);
        return json_decode($content, true) ?? [];
    }

    /**
     * Sauvegarder les partenariats dans le fichier JSON
     */
    private function savePartnerships($partnerships)
    {
        Storage::put(
            $this->partnershipsFile,
            json_encode($partnerships, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }

}
