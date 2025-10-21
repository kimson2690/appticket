<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Récupérer le rôle Administrateur
        $adminRole = Role::where('name', 'Administrateur')->first();
        
        if (!$adminRole) {
            $this->command->error('Le rôle Administrateur n\'existe pas. Exécutez d\'abord RoleSeeder.');
            return;
        }

        // Créer l'utilisateur administrateur par défaut
        $admin = User::firstOrCreate(
            ['email' => 'admin@appticket.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'System',
                'name' => 'Admin System', // Champ name requis par Laravel
                'email' => 'admin@appticket.com',
                'password' => Hash::make('admin123'),
                'phone' => '+221 77 123 45 67',
                'role_id' => $adminRole->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('✅ Utilisateur administrateur créé:');
        $this->command->info('📧 Email: admin@appticket.com');
        $this->command->info('🔑 Mot de passe: admin123');
        $this->command->info('👤 Nom: Admin System');
        $this->command->info('📱 Téléphone: +221 77 123 45 67');
    }
}
