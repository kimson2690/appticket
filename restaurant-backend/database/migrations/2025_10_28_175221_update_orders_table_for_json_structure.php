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
        
        // Drop old tables
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        
        // Recreate with correct structure
        Schema::create('orders', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // order_xxx
            $table->string('employee_id', 50); // emp_xxx
            $table->string('employee_name');
            $table->string('restaurant_id', 50);
            $table->json('items'); // Array of items
            $table->decimal('total_amount', 10, 2);
            $table->decimal('ticket_amount_used', 10, 2);
            $table->enum('status', ['pending', 'confirmed', 'rejected'])->default('pending');
            $table->string('delivery_address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Confirmation/rejection info
            $table->string('confirmed_by')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->string('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Index
            $table->index('employee_id');
            $table->index('restaurant_id');
            $table->index('status');
            $table->index('created_at');
        });
        
        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
