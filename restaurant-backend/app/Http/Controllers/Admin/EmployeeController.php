<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmployeeRegistrationPending;
use App\Mail\EmployeeApproved;
use App\Mail\EmployeeRejected;
use App\Mail\NewEmployeeRegistration;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees.
     */
    public function index(Request $request): JsonResponse
    {
        // Utiliser MySQL via Eloquent
        $userRole = $request->header('X-User-Role');
        $userCompanyId = $request->header('X-User-Company-Id');

        // Si le rôle est un objet JSON, extraire le nom
        if ($userRole && is_string($userRole) && (str_starts_with($userRole, '{') || str_starts_with($userRole, '['))) {
            $roleData = json_decode($userRole, true);
            $userRole = $roleData['name'] ?? $userRole;
        }

        Log::info('EmployeeController@index - Rôle: ' . $userRole . ', Company ID: ' . $userCompanyId);

        // Query builder
        $query = \App\Models\Employee::query();

        // Si gestionnaire d'entreprise, filtrer par son entreprise
        if ($userRole === 'Gestionnaire Entreprise' && $userCompanyId) {
            $query->where('company_id', $userCompanyId);
            Log::info('Employés filtrés pour gestionnaire entreprise ID: ' . $userCompanyId);
        }

        $employees = $query->get();

        // Calculer le solde réel (tickets valides non expirés) pour chaque employé
        $now = \Carbon\Carbon::now();
        $employeeIds = $employees->pluck('id')->toArray();
        $allBatches = \App\Models\TicketBatch::whereIn('employee_id', $employeeIds)->get();

        $result = $employees->map(function ($emp) use ($allBatches, $now) {
            $empBatches = $allBatches->filter(fn($b) => (string) $b->employee_id === (string) $emp->id);
            // Solde réel = souches actives ET non expirées (validity_end >= now)
            $activeBatches = $empBatches->filter(fn($b) =>
                $b->status === 'active' && \Carbon\Carbon::parse($b->validity_end)->gte($now)
            );
            $validBalance = $activeBatches->sum(fn($b) => (int) $b->remaining_tickets * (float) $b->ticket_value);

            $data = $emp->toArray();
            $data['valid_balance'] = (float) $validBalance;
            $data['ticket_balance_cumul'] = (float) $emp->ticket_balance;
            return $data;
        })->toArray();

        Log::info('Nombre d\'employés récupérés: ' . count($result));

        return response()->json([
            'success' => true,
            'data' => array_values($result)
        ]);
    }

    /**
     * Get company name by ID from database
     */
    private function getCompanyName(string $companyId): string
    {
        $company = \App\Models\Company::find($companyId);
        return $company ? $company->name : 'Non assigné';
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
            $password = $request->input('password');
            $phone = $request->input('phone', '');
            $company_id = $request->input('company_id', '1');
            $department = $request->input('department', '');
            $position = $request->input('position', '');
            $employee_number = $request->input('employee_number', '');
            $ticket_balance = $request->input('ticket_balance', 0);
            $status = $request->input('status', 'pending'); // Par défaut 'pending' pour auto-inscription
            $hire_date = $request->input('hire_date', null);

            // Nettoyer et valider la date d'embauche
            if ($hire_date) {
                // Convertir au format Y-m-d si ce n'est pas déjà le cas
                try {
                    $dateObj = new \DateTime($hire_date);
                    $hire_date = $dateObj->format('Y-m-d');
                } catch (\Exception $e) {
                    Log::warning('Format de date invalide pour hire_date: ' . $hire_date);
                    $hire_date = null;
                }
            }

            if (!$name || !$email || !$password) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nom, email et mot de passe sont requis'
                ], 422);
            }

            // Récupérer le nom de l'entreprise
            $companyName = $this->getCompanyName($company_id);

            // Créer l'employé en MySQL
            $employee = \App\Models\Employee::create([
                'id' => 'emp_' . time() . '_' . rand(1000, 9999),
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'phone' => $phone,
                'company_id' => $company_id,
                'company_name' => $companyName,
                'department' => $department,
                'position' => $position,
                'employee_number' => $employee_number,
                'ticket_balance' => (int) $ticket_balance,
                'status' => $status,
                'hire_date' => $hire_date,
            ]);

            $employeeData = $employee->toArray();

            Log::info('Employé sauvegardé dans MySQL:', $employeeData);

            // Créer une notification pour le gestionnaire si l'employé est en attente
            if ($status === 'pending') {
                NotificationController::createNotification([
                    'type' => 'info',
                    'title' => 'Nouvelle demande d\'inscription',
                    'message' => "$name souhaite rejoindre votre entreprise ($companyName) en tant que $position.",
                    'role' => 'Gestionnaire Entreprise',
                    'company_id' => $company_id,
                    'action_url' => '/admin/employees',
                    'metadata' => [
                        'employee_id' => $employeeData['id'],
                        'employee_name' => $name,
                        'employee_email' => $email
                    ]
                ]);

                // Envoyer email à l'employé
                try {
                    Mail::to($email)->send(new EmployeeRegistrationPending($name, $companyName));
                    Log::info("Email d'inscription en attente envoyé à: $email");
                } catch (\Exception $e) {
                    Log::error("Erreur envoi email à employé: " . $e->getMessage());
                }

                // Envoyer email au gestionnaire de l'entreprise
                try {
                    // Récupérer le gestionnaire de l'entreprise depuis la BD
                    $manager = User::where('company_id', $company_id)
                                  ->whereHas('role', function($query) {
                                      $query->where('name', 'Gestionnaire Entreprise');
                                  })
                                  ->first();

                    if ($manager && $manager->email) {
                        Mail::to($manager->email)->send(new NewEmployeeRegistration($name, $email, $companyName));
                        Log::info("Email de nouvelle inscription envoyé au gestionnaire: {$manager->email}");
                    } else {
                        Log::warning("Aucun gestionnaire trouvé pour l'entreprise $company_id");
                    }
                } catch (\Exception $e) {
                    Log::error("Erreur envoi email au gestionnaire: " . $e->getMessage());
                }
            }

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
            // Trouver l'employé en MySQL
            $employee = \App\Models\Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            $now = \Carbon\Carbon::now();

            // Souches de tickets
            $batches = \App\Models\TicketBatch::where('employee_id', $id)
                ->orderByDesc('created_at')
                ->get()
                ->map(function ($b) use ($now) {
                    $end = \Carbon\Carbon::parse($b->validity_end);
                    $isReallyActive = $b->status === 'active' && $end->gte($now);
                    $isExpired = $b->status === 'expired' || ($b->status === 'active' && $end->lt($now));

                    return [
                        'id' => $b->id,
                        'batch_number' => $b->batch_number,
                        'total_tickets' => (int) $b->total_tickets,
                        'used_tickets' => (int) $b->used_tickets,
                        'remaining_tickets' => (int) $b->remaining_tickets,
                        'ticket_value' => (float) $b->ticket_value,
                        'total_amount' => (float) ((int) $b->total_tickets * (float) $b->ticket_value),
                        'remaining_amount' => (float) ((int) $b->remaining_tickets * (float) $b->ticket_value),
                        'status' => $b->status,
                        'real_status' => $isReallyActive ? 'active' : ($isExpired ? 'expired' : $b->status),
                        'validity_start' => $b->validity_start,
                        'validity_end' => $b->validity_end,
                        'days_left' => $isReallyActive ? max(0, (int) $now->diffInDays($end, false)) : 0,
                        'created_at' => $b->created_at,
                    ];
                });

            // Solde réel (souches actives et non expirées)
            $validBalance = $batches->where('real_status', 'active')->sum('remaining_amount');

            // Dernières commandes
            $orders = \App\Models\Order::where('employee_id', $id)
                ->orderByDesc('created_at')
                ->limit(20)
                ->get()
                ->map(function ($o) {
                    return [
                        'id' => $o->id,
                        'restaurant_id' => $o->restaurant_id,
                        'total_amount' => (float) $o->total_amount,
                        'status' => $o->status,
                        'items' => $o->items,
                        'created_at' => $o->created_at,
                    ];
                });

            $data = $employee->toArray();
            $data['valid_balance'] = (float) $validBalance;
            $data['batches'] = $batches->values()->toArray();
            $data['recent_orders'] = $orders->values()->toArray();
            $data['stats'] = [
                'total_batches' => $batches->count(),
                'active_batches' => $batches->where('real_status', 'active')->count(),
                'expired_batches' => $batches->where('real_status', 'expired')->count(),
                'total_tickets_received' => (int) $batches->sum('total_tickets'),
                'total_tickets_used' => (int) $batches->sum('used_tickets'),
                'total_tickets_remaining' => (int) $batches->where('real_status', 'active')->sum('remaining_tickets'),
                'total_orders' => \App\Models\Order::where('employee_id', $id)->where('status', 'confirmed')->count(),
                'total_spent' => (float) \App\Models\Order::where('employee_id', $id)->where('status', 'confirmed')->sum('total_amount'),
            ];

            return response()->json([
                'success' => true,
                'data' => $data
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

            // Trouver l'employé en MySQL
            $employee = \App\Models\Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Préparer les données de mise à jour
            $updateData = [];
            if ($request->filled('name')) $updateData['name'] = $request->input('name');
            if ($request->filled('email')) $updateData['email'] = $request->input('email');
            if ($request->filled('phone')) $updateData['phone'] = $request->input('phone');
            if ($request->filled('department')) $updateData['department'] = $request->input('department');
            if ($request->filled('position')) $updateData['position'] = $request->input('position');
            if ($request->filled('employee_number')) $updateData['employee_number'] = $request->input('employee_number');
            if ($request->filled('ticket_balance')) $updateData['ticket_balance'] = (int) $request->input('ticket_balance');
            if ($request->filled('status')) $updateData['status'] = $request->input('status');

            // Nettoyer et valider la date d'embauche
            if ($request->filled('hire_date')) {
                $hire_date = $request->input('hire_date');
                if ($hire_date) {
                    try {
                        $dateObj = new \DateTime($hire_date);
                        $updateData['hire_date'] = $dateObj->format('Y-m-d');
                    } catch (\Exception $e) {
                        Log::warning('Format de date invalide pour hire_date: ' . $hire_date);
                        $updateData['hire_date'] = null;
                    }
                } else {
                    $updateData['hire_date'] = null;
                }
            }

            // Mettre à jour company_id et company_name si fourni
            if ($request->filled('company_id')) {
                $company_id = $request->input('company_id');
                $updateData['company_id'] = $company_id;
                $updateData['company_name'] = $this->getCompanyName($company_id);

                Log::info('Mise à jour avec nouvelle entreprise:', [
                    'company_id' => $company_id,
                    'company_name' => $updateData['company_name']
                ]);
            }

            // Si un nouveau mot de passe est fourni
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->input('password'));
                Log::info('Nouveau mot de passe hashé pour l\'employé');
            }

            // Détecter approbation/rejet
            $oldStatus = $employee->status;
            $newStatus = $updateData['status'] ?? $oldStatus;
            $isApproval = ($oldStatus === 'pending' && $newStatus === 'active');
            $isRejection = ($oldStatus === 'pending' && $newStatus === 'rejected');

            // Mettre à jour en MySQL
            $employee->update($updateData);

            Log::info('Employé mis à jour en MySQL:', $employee->toArray());

            // Rafraîchir pour obtenir les dernières données
            $employee->refresh();

            // Envoyer email d'approbation si nécessaire
            if ($isApproval) {
                try {
                    Mail::to($employee->email)->send(new EmployeeApproved($employee->name, $employee->company_name));
                    Log::info("Email d'approbation envoyé à: " . $employee->email);
                } catch (\Exception $e) {
                    Log::error("Erreur envoi email approbation: " . $e->getMessage());
                }
            }

            // Envoyer email de rejet si nécessaire
            if ($isRejection) {
                try {
                    Mail::to($employee->email)->send(new EmployeeRejected($employee->name, $employee->company_name));
                    Log::info("Email de rejet envoyé à: " . $employee->email);
                } catch (\Exception $e) {
                    Log::error("Erreur envoi email rejet: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'data' => $employee->toArray(),
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

            // Trouver et supprimer l'employé en MySQL
            $employee = \App\Models\Employee::find($id);

            if (!$employee) {
                Log::warning('Employé non trouvé pour suppression: ' . $id);
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Vérifier s'il y a des commandes associées
            $ordersCount = $employee->orders()->count();
            if ($ordersCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de supprimer cet employé car il est associé à {$ordersCount} commande(s). Vous pouvez le désactiver à la place."
                ], 422);
            }

            // Vérifier s'il y a des souches de tickets associées
            $batchesCount = \App\Models\TicketBatch::where('employee_id', $id)->count();
            if ($batchesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de supprimer cet employé car il possède {$batchesCount} souche(s) de tickets. Vous pouvez le désactiver à la place."
                ], 422);
            }

            $employee->delete();

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

    /**
     * Approuver une demande d'inscription
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        try {
            $employee = \App\Models\Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Mettre à jour le statut
            $employee->update(['status' => 'active']);

            // Créer une notification pour l'employé
            NotificationController::createNotification([
                'type' => 'success',
                'title' => 'Compte activé !',
                'message' => "Votre demande d'inscription a été approuvée. Bienvenue chez {$employee->company_name} !",
                'user_id' => $employee->id,
                'action_url' => '/login',
                'metadata' => [
                    'company_name' => $employee->company_name,
                    'approved_at' => date('Y-m-d H:i:s')
                ]
            ]);

            // Envoyer email d'approbation à l'employé
            try {
                Mail::to($employee->email)->send(new EmployeeApproved($employee->name, $employee->company_name));
                Log::info("Email d'approbation envoyé à: {$employee->email}");
            } catch (\Exception $e) {
                Log::error("Erreur envoi email approbation: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Employé approuvé avec succès',
                'data' => $employee->toArray()
            ]);

        } catch (\Exception $e) {
            Log::error('EmployeeController@approve - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Rejeter une demande d'inscription
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        try {
            // Trouver l'employé en MySQL
            $employee = \App\Models\Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employé non trouvé'
                ], 404);
            }

            // Créer une notification pour l'employé avant suppression
            NotificationController::createNotification([
                'type' => 'warning',
                'title' => 'Demande non approuvée',
                'message' => "Votre demande d'inscription chez {$employee->company_name} n'a pas été approuvée. Contactez votre gestionnaire pour plus d'informations.",
                'user_id' => $employee->id,
                'metadata' => [
                    'company_name' => $employee->company_name,
                    'rejected_at' => date('Y-m-d H:i:s')
                ]
            ]);

            // Envoyer email de rejet à l'employé
            try {
                Mail::to($employee->email)->send(new EmployeeRejected($employee->name, $employee->company_name));
                Log::info("Email de rejet envoyé à: {$employee->email}");
            } catch (\Exception $e) {
                Log::error("Erreur envoi email rejet: " . $e->getMessage());
            }

            // Supprimer l'employé rejeté
            $employee->delete();

            return response()->json([
                'success' => true,
                'message' => 'Demande rejetée avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('EmployeeController@reject - Erreur: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rejet',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
