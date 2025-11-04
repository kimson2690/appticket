<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MigrateJsonToMysqlSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Début de la migration JSON → MySQL...');
        
        // 1. Employees
        $this->migrateEmployees();
        
        // 2. Orders
        $this->migrateOrders();
        
        // 3. Ticket Batches
        $this->migrateTicketBatches();
        
        // 4. User Tickets (Assignments)
        $this->migrateUserTickets();
        
        // 5. Ticket Configurations
        $this->migrateTicketConfigurations();
        
        // 6. Menu Items
        $this->migrateMenuItems();
        
        // 7. Daily Menus
        $this->migrateDailyMenus();
        
        // 8. Notifications
        $this->migrateNotifications();
        
        $this->command->info('✅ Migration terminée avec succès !');
    }
    
    private function migrateEmployees()
    {
        $this->command->info('📝 Migration des employés...');
        
        $path = storage_path('app/employees.json');
        if (!file_exists($path)) {
            $this->command->warn('⚠️  Fichier employees.json introuvable');
            return;
        }
        
        $data = json_decode(file_get_contents($path), true);
        $count = 0;
        $errors = 0;
        
        foreach ($data as $employee) {
            try {
                \App\Models\Employee::updateOrCreate(
                    ['id' => $employee['id']],
                    $employee
                );
                $count++;
            } catch (\Exception $e) {
                $errors++;
                // Ignorer les doublons
            }
        }
        
        $this->command->info("✅ {$count} employés migrés" . ($errors > 0 ? " ({$errors} doublons ignorés)" : ""));
    }
    
    private function migrateOrders()
    {
        $this->command->info('📝 Migration des commandes...');
        
        $path = storage_path('app/orders.json');
        if (!file_exists($path)) {
            $this->command->warn('⚠️  Fichier orders.json introuvable');
            return;
        }
        
        $data = json_decode(file_get_contents($path), true);
        $count = 0;
        $errors = 0;
        
        $allowedFields = ['id', 'employee_id', 'employee_name', 'restaurant_id', 'items', 
                          'total_amount', 'ticket_amount_used', 'status', 'delivery_address', 
                          'notes', 'confirmed_by', 'confirmed_at', 'rejected_by', 'rejected_at', 
                          'rejection_reason', 'created_at', 'updated_at'];
        
        foreach ($data as $order) {
            try {
                // Filtrer les champs autorisés
                $filtered = array_intersect_key($order, array_flip($allowedFields));
                
                \App\Models\Order::updateOrCreate(
                    ['id' => $order['id']],
                    $filtered
                );
                $count++;
            } catch (\Exception $e) {
                $errors++;
            }
        }
        
        $this->command->info("✅ {$count} commandes migrées" . ($errors > 0 ? " ({$errors} erreurs ignorées)" : ""));
    }
    
    private function migrateTicketBatches()
    {
        $this->command->info('📝 Migration des souches de tickets...');
        
        $path = storage_path('app/ticket_batches.json');
        if (!file_exists($path)) {
            $this->command->warn('⚠️  Fichier ticket_batches.json introuvable');
            return;
        }
        
        $data = json_decode(file_get_contents($path), true);
        $count = 0;
        $errors = 0;
        
        foreach ($data as $batch) {
            try {
                \App\Models\TicketBatch::updateOrCreate(
                    ['id' => $batch['id']],
                    $batch
                );
                $count++;
            } catch (\Exception $e) {
                $errors++;
            }
        }
        
        $this->command->info("✅ {$count} souches migrées" . ($errors > 0 ? " ({$errors} erreurs ignorées)" : ""));
    }
    
    private function migrateUserTickets()
    {
        $this->command->info('📝 Migration des affectations de tickets...');
        
        $path = storage_path('app/ticket_assignments.json');
        if (!file_exists($path)) {
            $this->command->warn('⚠️  Fichier ticket_assignments.json introuvable');
            return;
        }
        
        $data = json_decode(file_get_contents($path), true);
        $count = 0;
        $errors = 0;
        
        $allowedFields = ['id', 'employee_id', 'employee_name', 'batch_id', 
                          'tickets_count', 'ticket_value', 'type', 'assigned_by', 
                          'notes', 'created_at'];
        
        foreach ($data as $assignment) {
            try {
                $filtered = array_intersect_key($assignment, array_flip($allowedFields));
                \App\Models\UserTicket::updateOrCreate(
                    ['id' => $assignment['id']],
                    $filtered
                );
                $count++;
            } catch (\Exception $e) {
                $errors++;
            }
        }
        
        $this->command->info("✅ {$count} affectations migrées" . ($errors > 0 ? " ({$errors} erreurs ignorées)" : ""));
    }
    
    private function migrateTicketConfigurations()
    {
        $this->command->info('📝 Migration des configurations de tickets...');
        
        $path = storage_path('app/ticket_configurations.json');
        if (!file_exists($path)) {
            $this->command->warn('⚠️  Fichier ticket_configurations.json introuvable');
            return;
        }
        
        $content = file_get_contents($path);
        $data = json_decode($content, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->command->warn('⚠️  Fichier ticket_configurations.json corrompu - ignoré');
            return;
        }
        
        $count = 0;
        $errors = 0;
        
        foreach ($data as $config) {
            try {
                \App\Models\TicketConfiguration::updateOrCreate(
                    ['id' => $config['id']],
                    $config
                );
                $count++;
            } catch (\Exception $e) {
                $errors++;
            }
        }
        
        $this->command->info("✅ {$count} configurations migrées" . ($errors > 0 ? " ({$errors} erreurs ignorées)" : ""));
    }
    
    private function migrateMenuItems()
    {
        $this->command->info('📝 Migration des plats du menu...');
        
        $path = storage_path('app/menu_items.json');
        if (!file_exists($path)) {
            $this->command->warn('⚠️  Fichier menu_items.json introuvable');
            return;
        }
        
        $data = json_decode(file_get_contents($path), true);
        $count = 0;
        $errors = 0;
        
        // Utiliser chunk pour éviter les problèmes de mémoire (746KB)
        $chunks = array_chunk($data, 100);
        
        foreach ($chunks as $chunk) {
            foreach ($chunk as $item) {
                try {
                    \App\Models\MenuItem::updateOrCreate(
                        ['id' => $item['id']],
                        $item
                    );
                    $count++;
                } catch (\Exception $e) {
                    $errors++;
                }
            }
        }
        
        $this->command->info("✅ {$count} plats migrés" . ($errors > 0 ? " ({$errors} erreurs ignorées)" : ""));
    }
    
    private function migrateDailyMenus()
    {
        $this->command->info('📝 Migration des menus du jour...');
        
        $path = storage_path('app/daily_menus.json');
        if (!file_exists($path)) {
            $this->command->warn('⚠️  Fichier daily_menus.json introuvable');
            return;
        }
        
        $data = json_decode(file_get_contents($path), true);
        $count = 0;
        $errors = 0;
        
        foreach ($data as $menu) {
            try {
                \App\Models\DailyMenu::updateOrCreate(
                    ['id' => $menu['id']],
                    $menu
                );
                $count++;
            } catch (\Exception $e) {
                $errors++;
            }
        }
        
        $this->command->info("✅ {$count} menus migrés" . ($errors > 0 ? " ({$errors} erreurs ignorées)" : ""));
    }
    
    private function migrateNotifications()
    {
        $this->command->info('📝 Migration des notifications...');
        
        $path = storage_path('app/notifications.json');
        if (!file_exists($path)) {
            $this->command->warn('⚠️  Fichier notifications.json introuvable');
            return;
        }
        
        $data = json_decode(file_get_contents($path), true);
        $count = 0;
        $errors = 0;
        
        // Limiter aux 1000 dernières notifications pour éviter surcharge
        $data = array_slice($data, -1000);
        
        foreach ($data as $notif) {
            try {
                \App\Models\Notification::updateOrCreate(
                    ['id' => $notif['id']],
                    $notif
                );
                $count++;
            } catch (\Exception $e) {
                $errors++;
            }
        }
        
        $this->command->info("✅ {$count} notifications migrées" . ($errors > 0 ? " ({$errors} erreurs ignorées)" : ""));
    }
}
