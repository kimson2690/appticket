<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\DeliveryLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class DeliveryLocationController extends Controller
{
    /**
     * Récupérer tous les lieux de livraison de l'entreprise
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->header('X-User-Company-Id');
        
        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non autorisé'
            ], 403);
        }

        $locations = DeliveryLocation::where('company_id', $companyId)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $locations
        ]);
    }

    /**
     * Récupérer uniquement les lieux actifs (pour les employés)
     */
    public function active(Request $request): JsonResponse
    {
        $companyId = $request->header('X-User-Company-Id');
        
        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non autorisé'
            ], 403);
        }

        $locations = DeliveryLocation::where('company_id', $companyId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $locations
        ]);
    }

    /**
     * Créer un nouveau lieu de livraison
     */
    public function store(Request $request): JsonResponse
    {
        $companyId = $request->header('X-User-Company-Id');
        $userRole = $request->header('X-User-Role');
        
        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non autorisé'
            ], 403);
        }

        // Vérifier que l'utilisateur est un gestionnaire
        if ($userRole !== 'Gestionnaire Entreprise') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les gestionnaires peuvent créer des lieux de livraison'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:255',
            'instructions' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['company_id'] = $companyId;

        $location = DeliveryLocation::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Lieu de livraison créé avec succès',
            'data' => $location
        ], 201);
    }

    /**
     * Afficher un lieu de livraison spécifique
     */
    public function show(Request $request, $id): JsonResponse
    {
        $companyId = $request->header('X-User-Company-Id');
        
        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non autorisé'
            ], 403);
        }

        $location = DeliveryLocation::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$location) {
            return response()->json([
                'success' => false,
                'message' => 'Lieu de livraison non trouvé'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $location
        ]);
    }

    /**
     * Mettre à jour un lieu de livraison
     */
    public function update(Request $request, $id): JsonResponse
    {
        $companyId = $request->header('X-User-Company-Id');
        $userRole = $request->header('X-User-Role');
        
        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non autorisé'
            ], 403);
        }

        // Vérifier que l'utilisateur est un gestionnaire
        if ($userRole !== 'Gestionnaire Entreprise') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les gestionnaires peuvent modifier des lieux de livraison'
            ], 403);
        }

        $location = DeliveryLocation::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$location) {
            return response()->json([
                'success' => false,
                'message' => 'Lieu de livraison non trouvé'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'building' => 'nullable|string|max:255',
            'floor' => 'nullable|string|max:255',
            'instructions' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $location->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Lieu de livraison mis à jour avec succès',
            'data' => $location
        ]);
    }

    /**
     * Supprimer un lieu de livraison
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $companyId = $request->header('X-User-Company-Id');
        $userRole = $request->header('X-User-Role');
        
        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non autorisé'
            ], 403);
        }

        // Vérifier que l'utilisateur est un gestionnaire
        if ($userRole !== 'Gestionnaire Entreprise') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les gestionnaires peuvent supprimer des lieux de livraison'
            ], 403);
        }

        $location = DeliveryLocation::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$location) {
            return response()->json([
                'success' => false,
                'message' => 'Lieu de livraison non trouvé'
            ], 404);
        }

        // Vérifier s'il y a des commandes associées
        $ordersCount = $location->orders()->count();
        
        if ($ordersCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Impossible de supprimer ce lieu car il est associé à {$ordersCount} commande(s). Vous pouvez le désactiver à la place."
            ], 422);
        }

        $location->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lieu de livraison supprimé avec succès'
        ]);
    }

    /**
     * Activer/Désactiver un lieu de livraison
     */
    public function toggleActive(Request $request, $id): JsonResponse
    {
        $companyId = $request->header('X-User-Company-Id');
        $userRole = $request->header('X-User-Role');
        
        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non autorisé'
            ], 403);
        }

        // Vérifier que l'utilisateur est un gestionnaire
        if ($userRole !== 'Gestionnaire Entreprise') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les gestionnaires peuvent activer/désactiver des lieux de livraison'
            ], 403);
        }

        $location = DeliveryLocation::where('id', $id)
            ->where('company_id', $companyId)
            ->first();

        if (!$location) {
            return response()->json([
                'success' => false,
                'message' => 'Lieu de livraison non trouvé'
            ], 404);
        }

        $location->is_active = !$location->is_active;
        $location->save();

        return response()->json([
            'success' => true,
            'message' => $location->is_active ? 'Lieu de livraison activé' : 'Lieu de livraison désactivé',
            'data' => $location
        ]);
    }
}
