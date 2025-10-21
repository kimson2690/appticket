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
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->enum('type', ['entreprise', 'restaurant', 'livraison']);
            $table->string('address', 255);
            $table->string('phone', 50);
            $table->string('email', 150);
            $table->foreignId('manager_id')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('ticket_value', 10, 2);
            $table->integer('ticket_validity_days');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
