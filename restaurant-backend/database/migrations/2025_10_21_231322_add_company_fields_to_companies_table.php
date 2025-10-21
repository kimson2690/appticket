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
        Schema::table('companies', function (Blueprint $table) {
            // Ajouter seulement les colonnes manquantes
            if (!Schema::hasColumn('companies', 'city')) {
                $table->string('city', 100)->after('address');
            }
            if (!Schema::hasColumn('companies', 'postal_code')) {
                $table->string('postal_code', 10)->nullable()->after('city');
            }
            if (!Schema::hasColumn('companies', 'country')) {
                $table->string('country', 100)->default('Sénégal')->after('postal_code');
            }
            if (!Schema::hasColumn('companies', 'website')) {
                $table->string('website')->nullable()->after('country');
            }
            if (!Schema::hasColumn('companies', 'description')) {
                $table->text('description')->nullable()->after('website');
            }
            if (!Schema::hasColumn('companies', 'status')) {
                $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('description');
            }
            if (!Schema::hasColumn('companies', 'ticket_balance')) {
                $table->integer('ticket_balance')->default(0)->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'address', 
                'city',
                'postal_code',
                'country',
                'website',
                'description',
                'status',
                'ticket_balance'
            ]);
        });
    }
};
