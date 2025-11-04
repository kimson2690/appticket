<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies.
     */
    public function index(): JsonResponse
    {
        try {
            // Charger les employés depuis MySQL
            $jsonEmployees = \App\Models\Employee::all()->toArray();

            $companies = Company::withCount('users')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($company) use ($jsonEmployees) {
                    // Compter les employés dans la base de données
                    $dbCount = $company->users_count;
                    
                    // Compter les employés dans le fichier JSON pour cette entreprise
                    $jsonCount = collect($jsonEmployees)->filter(function ($emp) use ($company) {
                        return isset($emp['company_id']) && $emp['company_id'] == $company->id;
                    })->count();
                    
                    // Total des employés
                    $totalEmployees = $dbCount + $jsonCount;

                    return [
                        'id' => (string) $company->id,
                        'name' => $company->name,
                        'email' => $company->email,
                        'phone' => $company->phone,
                        'address' => $company->address,
                        'city' => $company->city,
                        'postal_code' => $company->postal_code,
                        'country' => $company->country,
                        'website' => $company->website,
                        'description' => $company->description,
                        'status' => $company->status,
                        'employee_count' => $totalEmployees,
                        'ticket_balance' => $company->ticket_balance ?? 0,
                        'created_at' => $company->created_at->format('Y-m-d'),
                        'updated_at' => $company->updated_at->format('Y-m-d'),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $companies
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des entreprises',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created company.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:companies',
                'type' => 'nullable|string|max:10',
                'email' => 'required|email|max:255|unique:companies',
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:500',
                'city' => 'required|string|max:100',
                'postal_code' => 'nullable|string|max:10',
                'country' => 'required|string|max:100',
                'website' => 'nullable|url|max:255',
                'description' => 'nullable|string|max:1000',
                'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            ]);

            // Ajouter des valeurs par défaut pour les champs obligatoires
            $validated['ticket_value'] = $validated['ticket_value'] ?? 2500;
            $validated['ticket_validity_days'] = $validated['ticket_validity_days'] ?? 30;

            $company = Company::create($validated);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $company->id,
                    'name' => $company->name,
                    'email' => $company->email,
                    'phone' => $company->phone,
                    'address' => $company->address,
                    'city' => $company->city,
                    'postal_code' => $company->postal_code,
                    'country' => $company->country,
                    'website' => $company->website,
                    'description' => $company->description,
                    'status' => $company->status,
                    'employee_count' => 0,
                    'ticket_balance' => 0,
                    'created_at' => $company->created_at->format('Y-m-d'),
                    'updated_at' => $company->updated_at->format('Y-m-d'),
                ],
                'message' => 'Entreprise créée avec succès'
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
                'message' => 'Erreur lors de la création de l\'entreprise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified company.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $company = Company::withCount('users')->findOrFail($id);

            // Charger les employés depuis MySQL
            $jsonEmployees = \App\Models\Employee::all()->toArray();

            // Compter les employés dans la base de données
            $dbCount = $company->users_count;
            
            // Compter les employés dans le fichier JSON pour cette entreprise
            $jsonCount = collect($jsonEmployees)->filter(function ($emp) use ($company) {
                return isset($emp['company_id']) && $emp['company_id'] == $company->id;
            })->count();
            
            // Total des employés
            $totalEmployees = $dbCount + $jsonCount;

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $company->id,
                    'name' => $company->name,
                    'email' => $company->email,
                    'phone' => $company->phone,
                    'address' => $company->address,
                    'city' => $company->city,
                    'postal_code' => $company->postal_code,
                    'country' => $company->country,
                    'website' => $company->website,
                    'description' => $company->description,
                    'status' => $company->status,
                    'employee_count' => $totalEmployees,
                    'ticket_balance' => $company->ticket_balance ?? 0,
                    'created_at' => $company->created_at->format('Y-m-d'),
                    'updated_at' => $company->updated_at->format('Y-m-d'),
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Entreprise non trouvée'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'entreprise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified company.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $company = Company::findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:companies,name,' . $id,
                'email' => 'required|email|max:255|unique:companies,email,' . $id,
                'phone' => 'required|string|max:20',
                'address' => 'required|string|max:500',
                'city' => 'required|string|max:100',
                'postal_code' => 'nullable|string|max:10',
                'country' => 'required|string|max:100',
                'website' => 'nullable|url|max:255',
                'description' => 'nullable|string|max:1000',
                'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            ]);

            $company->update($validated);

            // Charger les employés depuis MySQL
            $jsonEmployees = \App\Models\Employee::all()->toArray();

            // Compter les employés dans la base de données
            $dbCount = $company->users()->count();
            
            // Compter les employés dans le fichier JSON pour cette entreprise
            $jsonCount = collect($jsonEmployees)->filter(function ($emp) use ($company) {
                return isset($emp['company_id']) && $emp['company_id'] == $company->id;
            })->count();
            
            // Total des employés
            $totalEmployees = $dbCount + $jsonCount;

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $company->id,
                    'name' => $company->name,
                    'email' => $company->email,
                    'phone' => $company->phone,
                    'address' => $company->address,
                    'city' => $company->city,
                    'postal_code' => $company->postal_code,
                    'country' => $company->country,
                    'website' => $company->website,
                    'description' => $company->description,
                    'status' => $company->status,
                    'employee_count' => $totalEmployees,
                    'ticket_balance' => $company->ticket_balance ?? 0,
                    'created_at' => $company->created_at->format('Y-m-d'),
                    'updated_at' => $company->updated_at->format('Y-m-d'),
                ],
                'message' => 'Entreprise mise à jour avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Entreprise non trouvée'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'entreprise',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified company.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $company = Company::findOrFail($id);
            
            // Charger les employés depuis MySQL
            $jsonEmployees = \App\Models\Employee::all()->toArray();

            // Compter les employés dans la base de données
            $dbCount = $company->users()->count();
            
            // Compter les employés dans le fichier JSON pour cette entreprise
            $jsonCount = collect($jsonEmployees)->filter(function ($emp) use ($company) {
                return isset($emp['company_id']) && $emp['company_id'] == $company->id;
            })->count();
            
            // Total des employés
            $totalEmployees = $dbCount + $jsonCount;
            
            // Vérifier s'il y a des employés associés (DB ou JSON)
            if ($totalEmployees > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer une entreprise qui a des employés associés'
                ], 400);
            }

            $company->delete();

            return response()->json([
                'success' => true,
                'message' => 'Entreprise supprimée avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Entreprise non trouvée'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'entreprise',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
