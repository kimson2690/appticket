<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees.
     */
    public function index(Request $request): JsonResponse
    {
        // Stockage persistant en fichier
        $filePath = storage_path('app/employees.json');
        
        if (file_exists($filePath)) {
            $employees = json_decode(file_get_contents($filePath), true) ?? [];
        } else {
            $employees = [];
        }

        return response()->json([
            'success' => true,
            'data' => $employees
        ]);
    }

    /**
     * Store a newly created employee.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('EmployeeController@store - Début');
            Log::info('Données reçues:', $request->all());
            
            // Validation des données requises
            $name = $request->input('name');
            $email = $request->input('email');
            $phone = $request->input('phone', '');
            $company_id = $request->input('company_id', '1');
            $department = $request->input('department', '');
            $position = $request->input('position', '');
            $status = $request->input('status', 'active');
            
            if (!$name || !$email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nom et email sont requis'
                ], 422);
            }

            // Charger les employés existants
            $filePath = storage_path('app/employees.json');
            $employees = [];
            
            if (file_exists($filePath)) {
                $employees = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Créer le nouvel employé
            $employeeData = [
                'id' => 'emp_' . time() . '_' . rand(1000, 9999),
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'company_id' => $company_id,
                'company_name' => 'TechCorp Solutions',
                'department' => $department,
                'position' => $position,
                'employee_number' => '',
                'ticket_balance' => 0,
                'status' => $status,
                'hire_date' => null,
                'created_at' => date('Y-m-d'),
                'updated_at' => date('Y-m-d'),
            ];

            // Ajouter à la liste
            $employees[] = $employeeData;

            // Sauvegarder dans le fichier
            file_put_contents($filePath, json_encode($employees, JSON_PRETTY_PRINT));

            Log::info('Employé sauvegardé dans le fichier:', $employeeData);

            return response()->json([
                'success' => true,
                'data' => $employeeData,
                'message' => 'Employé créé avec succès'
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('EmployeeController@store - Erreur générale: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified employee.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $employee = User::with(['role', 'company'])
                ->whereHas('role', function ($q) {
                    $q->where('name', 'Utilisateur');
                })
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'company_id' => (string) $employee->company_id,
                    'company_name' => $employee->company->name ?? 'Non assigné',
                    'department' => $employee->department,
                    'position' => $employee->position,
                    'employee_number' => $employee->employee_number,
                    'ticket_balance' => $employee->ticket_balance ?? 0,
                    'status' => $employee->status,
                    'hire_date' => $employee->hire_date?->format('Y-m-d'),
                    'created_at' => $employee->created_at->format('Y-m-d'),
                    'updated_at' => $employee->updated_at->format('Y-m-d'),
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Employé non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified employee.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $employee = User::whereHas('role', function ($q) {
                $q->where('name', 'Utilisateur');
            })->findOrFail($id);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $id,
                'phone' => 'nullable|string|max:20',
                'password' => 'nullable|string|min:6',
                'company_id' => 'required|exists:companies,id',
                'department' => 'nullable|string|max:100',
                'position' => 'nullable|string|max:100',
                'employee_number' => 'nullable|string|max:50|unique:users,employee_number,' . $id,
                'ticket_balance' => 'nullable|numeric|min:0',
                'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
                'hire_date' => 'nullable|date',
            ]);

            // Diviser le nom complet en prénom et nom
            $nameParts = explode(' ', trim($validated['name']), 2);
            $validated['first_name'] = $nameParts[0];
            $validated['last_name'] = $nameParts[1] ?? '';

            // Hasher le mot de passe seulement s'il est fourni
            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $employee->update($validated);
            $employee->load(['role', 'company']);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => (string) $employee->id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'phone' => $employee->phone,
                    'company_id' => (string) $employee->company_id,
                    'company_name' => $employee->company->name,
                    'department' => $employee->department,
                    'position' => $employee->position,
                    'employee_number' => $employee->employee_number,
                    'ticket_balance' => $employee->ticket_balance,
                    'status' => $employee->status,
                    'hire_date' => $employee->hire_date?->format('Y-m-d'),
                    'created_at' => $employee->created_at->format('Y-m-d'),
                    'updated_at' => $employee->updated_at->format('Y-m-d'),
                ],
                'message' => 'Employé mis à jour avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Employé non trouvé'
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
                'message' => 'Erreur lors de la mise à jour de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified employee.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $employee = User::whereHas('role', function ($q) {
                $q->where('name', 'Utilisateur');
            })->findOrFail($id);

            $employee->delete();

            return response()->json([
                'success' => true,
                'message' => 'Employé supprimé avec succès'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Employé non trouvé'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
