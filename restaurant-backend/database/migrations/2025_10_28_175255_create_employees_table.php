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
        Schema::create('employees', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // emp_1761097536_1051
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone', 20)->nullable();
            $table->string('password');
            $table->unsignedBigInteger('company_id');
            $table->string('company_name')->nullable();
            $table->string('department')->nullable();
            $table->string('position')->nullable();
            $table->string('employee_number', 50)->nullable();
            $table->decimal('ticket_balance', 10, 2)->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->date('hire_date')->nullable();
            $table->timestamps();
            
            // Index
            $table->index('company_id');
            $table->index('status');
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
