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
            
            // Corriger les données incohérentes (company_name basé sur company_id)
            $corrected = false;
            foreach ($employees as &$employee) {
                $correctCompanyName = $this->getCompanyName($employee['company_id'] ?? '');
                if ($employee['company_name'] !== $correctCompanyName) {
                    $employee['company_name'] = $correctCompanyName;
                    $corrected = true;
                }
            }
            
            // Sauvegarder si des corrections ont été apportées
            if ($corrected) {
                file_put_contents($filePath, json_encode($employees, JSON_PRETTY_PRINT));
                Log::info('Données employés corrigées pour cohérence des entreprises');
            }
        } else {
            $employees = [];
        }

        return response()->json([
            'success' => true,
            'data' => $employees
        ]);
    }

    /**
     * Get company name by ID
     */
    private function getCompanyName(string $companyId): string
    {
        switch ($companyId) {
            case '1':
                return 'TechCorp Solutions';
            case '2':
                return 'Burkina Tech SARL';
            default:
                return 'Non assigné';
        }
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

            // Récupérer le nom de l'entreprise basé sur le company_id
            $companyName = $this->getCompanyName($company_id);

            // Créer le nouvel employé
            $employeeData = [
                'id' => 'emp_' . time() . '_' . rand(1000, 9999),
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'company_id' => $company_id,
                'company_name' => $companyName,
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
            // Charger les employés depuis le fichier
            $filePath = storage_path('app/employees.json');
            $employees = [];
            
            if (file_exists($filePath)) {
                $employees = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Trouver l'employé par ID
            $employee = collect($employees)->firstWhere('id', $id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $employee
            ]);
            
        } catch (\Exception $e) {
            Log::error('EmployeeController@show - Erreur: ' . $e->getMessage());
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
            Log::info('EmployeeController@update - Début pour ID: ' . $id);
            Log::info('Données reçues:', $request->all());
            
            // Charger les employés depuis le fichier
            $filePath = storage_path('app/employees.json');
            $employees = [];
            
            if (file_exists($filePath)) {
                $employees = json_decode(file_get_contents($filePath), true) ?? [];
            }

            // Trouver l'index de l'employé
            $employeeIndex = collect($employees)->search(function ($employee) use ($id) {
                return $employee['id'] === $id;
            });

            if ($employeeIndex === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Récupérer les nouvelles données
            $name = $request->input('name', $employees[$employeeIndex]['name']);
            $email = $request->input('email', $employees[$employeeIndex]['email']);
            $phone = $request->input('phone', $employees[$employeeIndex]['phone']);
            $company_id = $request->input('company_id', $employees[$employeeIndex]['company_id']);
            $department = $request->input('department', $employees[$employeeIndex]['department']);
            $position = $request->input('position', $employees[$employeeIndex]['position']);
            $status = $request->input('status', $employees[$employeeIndex]['status']);

            // Récupérer le nom de l'entreprise basé sur le company_id
            $companyName = $this->getCompanyName($company_id);

            Log::info('Mise à jour avec nouvelle entreprise:', [
                'company_id' => $company_id,
                'company_name' => $companyName
            ]);

            // Mettre à jour l'employé
            $employees[$employeeIndex] = array_merge($employees[$employeeIndex], [
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'company_id' => $company_id,
                'company_name' => $companyName, // Mise à jour du nom de l'entreprise
                'department' => $department,
                'position' => $position,
                'status' => $status,
                'updated_at' => date('Y-m-d'),
            ]);

            // Sauvegarder dans le fichier
            file_put_contents($filePath, json_encode($employees, JSON_PRETTY_PRINT));

            Log::info('Employé mis à jour:', $employees[$employeeIndex]);

            return response()->json([
                'success' => true,
                'data' => $employees[$employeeIndex],
                'message' => 'Employé mis à jour avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('EmployeeController@update - Erreur: ' . $e->getMessage());
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
            Log::info('EmployeeController@destroy - Suppression ID: ' . $id);
            
            // Charger les employés depuis le fichier
            $filePath = storage_path('app/employees.json');
            $employees = [];
            
            if (file_exists($filePath)) {
                $employees = json_decode(file_get_contents($filePath), true) ?? [];
            }

            Log::info('Employés avant suppression:', ['count' => count($employees)]);

            // Filtrer pour supprimer l'employé
            $originalCount = count($employees);
            $employees = array_values(array_filter($employees, function ($employee) use ($id) {
                return $employee['id'] !== $id;
            }));

            Log::info('Employés après suppression:', ['count' => count($employees), 'original' => $originalCount]);

            if (count($employees) === $originalCount) {
                Log::warning('Employé non trouvé pour suppression: ' . $id);
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Sauvegarder dans le fichier
            file_put_contents($filePath, json_encode($employees, JSON_PRETTY_PRINT));

            Log::info('Employé supprimé avec succès: ' . $id);

            return response()->json([
                'success' => true,
                'message' => 'Employé supprimé avec succès'
            ]);
            
        } catch (\Exception $e) {
            Log::error('EmployeeController@destroy - Erreur: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
