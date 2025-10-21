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
        Schema::table('restaurants', function (Blueprint $table) {
            // Ajouter seulement les colonnes manquantes
            if (!Schema::hasColumn('restaurants', 'city')) {
                $table->string('city', 100)->nullable()->after('address');
            }
            if (!Schema::hasColumn('restaurants', 'postal_code')) {
                $table->string('postal_code', 10)->nullable()->after('city');
            }
            if (!Schema::hasColumn('restaurants', 'country')) {
                $table->string('country', 100)->default('Sénégal')->after('postal_code');
            }
            if (!Schema::hasColumn('restaurants', 'cuisine_type')) {
                $table->string('cuisine_type', 100)->nullable()->after('country');
            }
            if (!Schema::hasColumn('restaurants', 'description')) {
                $table->text('description')->nullable()->after('cuisine_type');
            }
            if (!Schema::hasColumn('restaurants', 'logo')) {
                $table->string('logo')->nullable()->after('description');
            }
            if (!Schema::hasColumn('restaurants', 'website')) {
                $table->string('website')->nullable()->after('logo');
            }
            if (!Schema::hasColumn('restaurants', 'opening_hours')) {
                $table->string('opening_hours')->nullable()->after('website');
            }
            if (!Schema::hasColumn('restaurants', 'delivery_fee')) {
                $table->decimal('delivery_fee', 8, 2)->default(0)->after('opening_hours');
            }
            if (!Schema::hasColumn('restaurants', 'minimum_order')) {
                $table->decimal('minimum_order', 8, 2)->default(0)->after('delivery_fee');
            }
            if (!Schema::hasColumn('restaurants', 'average_rating')) {
                $table->decimal('average_rating', 3, 2)->default(0)->after('minimum_order');
            }
            if (!Schema::hasColumn('restaurants', 'total_reviews')) {
                $table->integer('total_reviews')->default(0)->after('average_rating');
            }
            if (!Schema::hasColumn('restaurants', 'status')) {
                $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('total_reviews');
            }
            if (!Schema::hasColumn('restaurants', 'is_partner')) {
                $table->boolean('is_partner')->default(true)->after('status');
            }
            if (!Schema::hasColumn('restaurants', 'commission_rate')) {
                $table->decimal('commission_rate', 5, 2)->default(15)->after('is_partner');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn([
                'city',
                'postal_code',
                'country',
                'cuisine_type',
                'description',
                'logo',
                'website',
                'opening_hours',
                'delivery_fee',
                'minimum_order',
                'average_rating',
                'total_reviews',
                'status',
                'is_partner',
                'commission_rate'
            ]);
        });
    }
};
