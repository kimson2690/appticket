<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Administrateur',
                'description' => 'Administrateur système avec tous les droits',
                'is_system' => true,
                'permissions' => ['all']
            ],
            [
                'name' => 'Gestionnaire Entreprise',
                'description' => 'Gestionnaire d\'entreprise - gestion des employés et tickets',
                'is_system' => true,
                'permissions' => ['manage_employees', 'manage_tickets', 'view_reports']
            ],
            [
                'name' => 'Gestionnaire Restaurant',
                'description' => 'Gestionnaire de restaurant - gestion des menus et commandes',
                'is_system' => true,
                'permissions' => ['manage_menu', 'manage_orders', 'view_analytics']
            ],
            [
                'name' => 'Utilisateur',
                'description' => 'Employé d\'entreprise - peut passer des commandes',
                'is_system' => true,
                'permissions' => ['place_orders', 'view_profile']
            ],
            [
                'name' => 'Gestionnaire Livraison',
                'description' => 'Gestionnaire de société de livraison',
                'is_system' => false,
                'permissions' => ['manage_deliveries', 'update_status']
            ]
        ];

        foreach ($roles as $roleData) {
            $permissions = $roleData['permissions'];
            unset($roleData['permissions']);
            
            $role = Role::firstOrCreate(
                ['name' => $roleData['name']],
                $roleData
            );

            // Attacher les permissions
            $permissionIds = Permission::whereIn('name', $permissions)->pluck('id');
            $role->permissions()->sync($permissionIds);
        }
    }
}
