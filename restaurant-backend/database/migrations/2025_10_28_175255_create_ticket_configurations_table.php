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
        Schema::create('ticket_configurations', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // config_xxx
            $table->unsignedBigInteger('company_id');
            $table->string('company_name');
            $table->decimal('ticket_value', 10, 2);
            $table->integer('monthly_allocation')->default(0);
            $table->integer('validity_days')->default(30);
            $table->boolean('rollover_unused')->default(false);
            $table->decimal('max_order_amount', 10, 2)->nullable();
            $table->json('allowed_days')->nullable(); // ["lundi", "mardi", ...]
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->boolean('weekend_usage')->default(true);
            $table->text('restrictions')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            
            // Index
            $table->index('company_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_configurations');
    }
};
