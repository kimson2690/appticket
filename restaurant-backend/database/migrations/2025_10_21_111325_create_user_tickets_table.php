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
        Schema::create('user_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('ticket_batch_id')->constrained('ticket_batches')->onDelete('cascade');
            $table->string('code', 50)->unique();
            $table->decimal('value', 10, 2);
            $table->enum('status', ['valide', 'utilisé', 'expiré'])->default('valide');
            $table->datetime('assigned_at');
            $table->datetime('used_at')->nullable();
            $table->timestamps();
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
