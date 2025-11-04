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
        // Drop old table
        Schema::dropIfExists('user_tickets');
        
        // Recreate with correct structure
        Schema::create('user_tickets', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // assign_xxx
            $table->string('employee_id', 50);
            $table->string('employee_name');
            $table->string('batch_id', 50)->nullable();
            $table->integer('tickets_count');
            $table->decimal('ticket_value', 10, 2);
            $table->enum('type', ['manual', 'batch'])->default('manual');
            $table->string('assigned_by');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            // Index
            $table->index('employee_id');
            $table->index('batch_id');
            $table->index('type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_tickets');
    }
};
