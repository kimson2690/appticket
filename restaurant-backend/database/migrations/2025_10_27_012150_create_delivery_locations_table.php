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
        Schema::create('delivery_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('name'); // Nom du lieu (ex: "Bureau Principal", "Entrepôt", "Cafétéria")
            $table->text('address')->nullable(); // Adresse complète
            $table->string('building')->nullable(); // Bâtiment
            $table->string('floor')->nullable(); // Étage
            $table->text('instructions')->nullable(); // Instructions de livraison
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_locations');
    }
};
