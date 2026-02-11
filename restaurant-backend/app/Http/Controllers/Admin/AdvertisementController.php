<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdvertisementController extends Controller
{
    /**
     * Liste toutes les publicités (admin)
     */
    public function index(): JsonResponse
    {
        try {
            $ads = Advertisement::orderBy('display_order')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $ads
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des publicités',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Publicités actives (endpoint public pour les employés)
     */
    public function active(): JsonResponse
    {
        try {
            $ads = Advertisement::active()
                ->orderBy('display_order')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $ads
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des publicités',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une publicité avec upload de média
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string|max:1000',
                'media' => 'required|file|mimes:jpg,jpeg,png,gif,webp,mp4,webm,mov|max:51200',
                'link_url' => 'nullable|url|max:500',
                'status' => 'nullable|string|in:active,inactive',
                'display_order' => 'nullable|integer|min:0',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            $file = $request->file('media');
            $extension = $file->getClientOriginalExtension();
            $isVideo = in_array(strtolower($extension), ['mp4', 'webm', 'mov']);
            $mediaType = $isVideo ? 'video' : 'image';

            // Stocker le fichier dans storage/app/public/advertisements
            $fileName = 'ad_' . Str::random(16) . '.' . $extension;
            Storage::disk('public')->putFileAs('advertisements', $file, $fileName);

            // URL accessible publiquement
            $mediaUrl = url('storage/advertisements/' . $fileName);

            $ad = Advertisement::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'media_type' => $mediaType,
                'media_url' => $mediaUrl,
                'link_url' => $validated['link_url'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'display_order' => $validated['display_order'] ?? 0,
                'start_date' => $validated['start_date'] ?? null,
                'end_date' => $validated['end_date'] ?? null,
                'created_by' => $request->header('X-User-Name', 'Admin'),
            ]);

            return response()->json([
                'success' => true,
                'data' => $ad,
                'message' => 'Publicité créée avec succès'
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la publicité',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour une publicité
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $ad = Advertisement::findOrFail($id);

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string|max:1000',
                'media' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp,mp4,webm,mov|max:51200',
                'link_url' => 'nullable|url|max:500',
                'status' => 'nullable|string|in:active,inactive',
                'display_order' => 'nullable|integer|min:0',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            // Si un nouveau média est uploadé
            if ($request->hasFile('media')) {
                // Supprimer l'ancien fichier
                $oldFileName = basename($ad->media_url);
                if (Storage::disk('public')->exists('advertisements/' . $oldFileName)) {
                    Storage::disk('public')->delete('advertisements/' . $oldFileName);
                }

                $file = $request->file('media');
                $extension = $file->getClientOriginalExtension();
                $isVideo = in_array(strtolower($extension), ['mp4', 'webm', 'mov']);

                $fileName = 'ad_' . Str::random(16) . '.' . $extension;
                Storage::disk('public')->putFileAs('advertisements', $file, $fileName);

                $ad->media_type = $isVideo ? 'video' : 'image';
                $ad->media_url = url('storage/advertisements/' . $fileName);
            }

            $ad->title = $validated['title'] ?? $ad->title;
            $ad->description = $validated['description'] ?? $ad->description;
            $ad->link_url = $validated['link_url'] ?? $ad->link_url;
            $ad->status = $validated['status'] ?? $ad->status;
            $ad->display_order = $validated['display_order'] ?? $ad->display_order;
            $ad->start_date = array_key_exists('start_date', $validated) ? $validated['start_date'] : $ad->start_date;
            $ad->end_date = array_key_exists('end_date', $validated) ? $validated['end_date'] : $ad->end_date;
            $ad->save();

            return response()->json([
                'success' => true,
                'data' => $ad,
                'message' => 'Publicité mise à jour avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Publicité non trouvée'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une publicité
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $ad = Advertisement::findOrFail($id);

            // Supprimer le fichier média
            $oldFileName = basename($ad->media_url);
            if (Storage::disk('public')->exists('advertisements/' . $oldFileName)) {
                Storage::disk('public')->delete('advertisements/' . $oldFileName);
            }

            $ad->delete();

            return response()->json([
                'success' => true,
                'message' => 'Publicité supprimée avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Publicité non trouvée'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle le statut d'une publicité
     */
    public function toggleStatus(string $id): JsonResponse
    {
        try {
            $ad = Advertisement::findOrFail($id);
            $ad->status = $ad->status === 'active' ? 'inactive' : 'active';
            $ad->save();

            return response()->json([
                'success' => true,
                'data' => $ad,
                'message' => 'Statut mis à jour'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
