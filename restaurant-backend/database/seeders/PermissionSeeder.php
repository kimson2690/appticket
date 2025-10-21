<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Système
            [
                'name' => 'all',
                'description' => 'Accès administrateur complet',
                'category' => 'Système'
            ],
            
            // Entreprise
            [
                'name' => 'manage_employees',
                'description' => 'Créer, modifier, supprimer des employés',
                'category' => 'Entreprise'
            ],
            [
                'name' => 'manage_tickets',
                'description' => 'Acheter et distribuer des tickets',
                'category' => 'Entreprise'
            ],
            [
                'name' => 'view_reports',
                'description' => 'Accès aux rapports et statistiques',
                'category' => 'Entreprise'
            ],
            
            // Restaurant
            [
                'name' => 'manage_menu',
                'description' => 'Créer et modifier les plats du menu',
                'category' => 'Restaurant'
            ],
            [
                'name' => 'manage_orders',
                'description' => 'Traiter et valider les commandes',
                'category' => 'Restaurant'
            ],
            [
                'name' => 'view_analytics',
                'description' => 'Accès aux analyses de performance',
                'category' => 'Restaurant'
            ],
            
            // Utilisateur
            [
                'name' => 'place_orders',
                'description' => 'Commander des repas avec des tickets',
                'category' => 'Utilisateur'
            ],
            [
                'name' => 'view_profile',
                'description' => 'Consulter et modifier son profil',
                'category' => 'Utilisateur'
            ],
            
            // Livraison
            [
                'name' => 'manage_deliveries',
                'description' => 'Prendre en charge les livraisons',
                'category' => 'Livraison'
            ],
            [
                'name' => 'update_status',
                'description' => 'Modifier le statut des livraisons',
                'category' => 'Livraison'
            ]
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }
    }
}
