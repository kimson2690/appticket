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
        Schema::table('orders', function (Blueprint $table) {
            // Supprimer l'ancien champ delivery_place
            $table->dropColumn('delivery_place');
            
            // Ajouter le nouveau champ delivery_location_id
            $table->foreignId('delivery_location_id')->nullable()->after('company_id')->constrained('delivery_locations')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Supprimer delivery_location_id
            $table->dropForeign(['delivery_location_id']);
            $table->dropColumn('delivery_location_id');
            
            // Restaurer delivery_place
            $table->string('delivery_place', 150)->after('company_id');
        });
    }
};
