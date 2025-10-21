<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Administrateur',
                'description' => 'Administrateur système avec tous les droits'
            ],
            [
                'name' => 'Gestionnaire Entreprise',
                'description' => 'Gestionnaire d\'entreprise - gestion des employés et tickets'
            ],
            [
                'name' => 'Gestionnaire Restaurant',
                'description' => 'Gestionnaire de restaurant - gestion des menus et commandes'
            ],
            [
                'name' => 'Utilisateur',
                'description' => 'Employé d\'entreprise - peut passer des commandes'
            ],
            [
                'name' => 'Gestionnaire Livraison',
                'description' => 'Gestionnaire de société de livraison'
            ]
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}
