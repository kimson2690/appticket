<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('primary_color', 7)->nullable()->default('#f97316');
            $table->string('secondary_color', 7)->nullable()->default('#ea580c');
            $table->string('logo_url')->nullable();
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->string('primary_color', 7)->nullable()->default('#f97316');
            $table->string('secondary_color', 7)->nullable()->default('#ea580c');
            $table->string('logo_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['primary_color', 'secondary_color', 'logo_url']);
        });

        Schema::table('restaurants', function (Blueprint $table) {
            $table->dropColumn(['primary_color', 'secondary_color', 'logo_url']);
        });
    }
};
