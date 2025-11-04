<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modifier l'enum status pour ajouter 'pending' et 'rejected'
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('active', 'inactive', 'pending', 'rejected') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Retour à l'ancien enum
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('active', 'inactive') DEFAULT 'active'");
    }
};
