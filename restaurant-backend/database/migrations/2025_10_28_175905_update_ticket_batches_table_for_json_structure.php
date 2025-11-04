<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Disable foreign key checks
        Schema::disableForeignKeyConstraints();
        
        // Drop tables with foreign keys first
        Schema::dropIfExists('user_tickets'); // Has FK to ticket_batches
        Schema::dropIfExists('ticket_batches');
        
        // Recreate with correct structure
        Schema::create('ticket_batches', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // batch_xxx
            $table->string('batch_number')->unique();
            $table->unsignedBigInteger('company_id');
            $table->string('config_id', 50)->nullable();
            $table->string('employee_id', 50);
            $table->string('employee_name');
            $table->string('created_by');
            $table->integer('total_tickets');
            $table->decimal('ticket_value', 10, 2);
            $table->enum('type', ['standard', 'special'])->default('standard');
            $table->date('validity_start');
            $table->date('validity_end');
            $table->integer('assigned_tickets')->default(0);
            $table->integer('used_tickets')->default(0);
            $table->integer('remaining_tickets')->default(0);
            $table->enum('status', ['active', 'expired', 'depleted'])->default('active');
            $table->json('tickets'); // Array of individual tickets
            $table->timestamps();
            
            // Index
            $table->index('company_id');
            $table->index('employee_id');
            $table->index('batch_number');
            $table->index('status');
            $table->index(['validity_start', 'validity_end']);
        });
        
        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_batches');
    }
};
