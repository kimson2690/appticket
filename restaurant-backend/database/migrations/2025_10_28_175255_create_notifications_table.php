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
        Schema::create('notifications', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // notif_xxx
            $table->enum('type', ['success', 'error', 'warning', 'info'])->default('info');
            $table->string('title');
            $table->text('message');
            $table->string('user_id', 50)->nullable(); // employee_id
            $table->string('role', 50)->nullable();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedBigInteger('restaurant_id')->nullable();
            $table->string('action_url')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            // Index
            $table->index('user_id');
            $table->index('role');
            $table->index('company_id');
            $table->index('restaurant_id');
            $table->index('read');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
