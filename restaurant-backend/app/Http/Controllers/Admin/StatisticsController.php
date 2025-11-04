<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use App\Models\Restaurant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class StatisticsController extends Controller
{
    /**
     * Get global statistics
     */
    public function index(Request $request): JsonResponse
    {
        try {
            Log::info('StatisticsController@index - Récupération des statistiques globales');

            // Statistiques des utilisateurs
            $totalUsers = User::count();
            $activeUsers = User::where('status', 'active')->count();
            $adminUsers = User::whereHas('role', function ($q) {
                $q->where('name', 'Administrateur');
            })->count();
            $managerUsers = User::whereHas('role', function ($q) {
                $q->whereIn('name', ['Gestionnaire Entreprise', 'Gestionnaire Restaurant']);
            })->count();
            $employeeUsers = User::whereHas('role', function ($q) {
                $q->where('name', 'Utilisateur');
            })->count();

            // Statistiques des entreprises
            $totalCompanies = Company::count();
            $activeCompanies = Company::where('status', 'active')->count();

            // Statistiques des restaurants
            $totalRestaurants = Restaurant::count();
            $activeRestaurants = Restaurant::where('status', 'active')->count();

            // Statistiques des employés (depuis le fichier JSON)
            $employeesFromFile = $this->getEmployeesFromFile();
            $totalEmployees = count($employeesFromFile);
            $activeEmployees = collect($employeesFromFile)->where('status', 'active')->count();
            $totalTicketBalance = collect($employeesFromFile)->sum('ticket_balance');

            // Statistiques par entreprise
            $companiesStats = Company::all()->map(function ($company) use ($employeesFromFile) {
                $companyEmployees = collect($employeesFromFile)->where('company_id', (string)$company->id);
                return [
                    'company_id' => $company->id,
                    'company_name' => $company->name,
                    'employee_count' => $companyEmployees->count(),
                    'active_employees' => $companyEmployees->where('status', 'active')->count(),
                    'total_tickets' => $companyEmployees->sum('ticket_balance'),
                ];
            });

            // Statistiques des départements
            $departmentStats = collect($employeesFromFile)
                ->groupBy('department')
                ->map(function ($employees, $department) {
                    return [
                        'department' => $department ?: 'Non spécifié',
                        'employee_count' => $employees->count(),
                        'total_tickets' => $employees->sum('ticket_balance'),
                    ];
                })
                ->values();

            // Données pour les graphiques
            $monthlyStats = $this->getMonthlyStats();
            $ticketDistribution = $this->getTicketDistribution($employeesFromFile);

            $statistics = [
                'overview' => [
                    'total_users' => $totalUsers,
                    'active_users' => $activeUsers,
                    'total_companies' => $totalCompanies,
                    'active_companies' => $activeCompanies,
                    'total_restaurants' => $totalRestaurants,
                    'active_restaurants' => $activeRestaurants,
                    'total_employees' => $totalEmployees,
                    'active_employees' => $activeEmployees,
                    'total_ticket_balance' => $totalTicketBalance,
                ],
                'users_by_role' => [
                    'administrators' => $adminUsers,
                    'managers' => $managerUsers,
                    'employees' => $employeeUsers,
                ],
                'companies_stats' => $companiesStats,
                'department_stats' => $departmentStats,
                'monthly_stats' => $monthlyStats,
                'ticket_distribution' => $ticketDistribution,
                'generated_at' => now()->format('Y-m-d H:i:s'),
            ];

            Log::info('Statistiques générées avec succès', [
                'total_users' => $totalUsers,
                'total_employees' => $totalEmployees,
                'total_tickets' => $totalTicketBalance
            ]);

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);

        } catch (\Exception $e) {
            Log::error('StatisticsController@index - Erreur: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get employees from JSON file
     */
    private function getEmployeesFromFile(): array
    {
        return \App\Models\Employee::all()->toArray();
    }

    /**
     * Get monthly statistics (simulated data for now)
     */
    private function getMonthlyStats(): array
    {
        return [
            ['month' => 'Jan', 'users' => 45, 'tickets' => 1200, 'orders' => 89],
            ['month' => 'Fév', 'users' => 52, 'tickets' => 1450, 'orders' => 102],
            ['month' => 'Mar', 'users' => 48, 'tickets' => 1380, 'orders' => 95],
            ['month' => 'Avr', 'users' => 61, 'tickets' => 1650, 'orders' => 118],
            ['month' => 'Mai', 'users' => 55, 'tickets' => 1520, 'orders' => 108],
            ['month' => 'Juin', 'users' => 67, 'tickets' => 1780, 'orders' => 125],
        ];
    }

    /**
     * Get ticket distribution by ranges
     */
    private function getTicketDistribution(array $employees): array
    {
        $ranges = [
            '0' => ['min' => 0, 'max' => 0, 'label' => '0 ticket'],
            '1-10' => ['min' => 1, 'max' => 10, 'label' => '1-10 tickets'],
            '11-50' => ['min' => 11, 'max' => 50, 'label' => '11-50 tickets'],
            '51-100' => ['min' => 51, 'max' => 100, 'label' => '51-100 tickets'],
            '100+' => ['min' => 101, 'max' => PHP_INT_MAX, 'label' => '100+ tickets'],
        ];

        $distribution = [];
        foreach ($ranges as $key => $range) {
            $count = collect($employees)->filter(function ($employee) use ($range) {
                $balance = $employee['ticket_balance'] ?? 0;
                return $balance >= $range['min'] && $balance <= $range['max'];
            })->count();

            $distribution[] = [
                'range' => $key,
                'label' => $range['label'],
                'count' => $count,
                'percentage' => count($employees) > 0 ? round(($count / count($employees)) * 100, 1) : 0,
            ];
        }

        return $distribution;
    }
}
