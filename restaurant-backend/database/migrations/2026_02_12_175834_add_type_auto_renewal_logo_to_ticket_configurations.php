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
        Schema::table('ticket_configurations', function (Blueprint $table) {
            $table->string('type')->default('standard')->after('status');
            $table->boolean('auto_renewal')->default(false)->after('type');
            $table->longText('logo')->nullable()->after('auto_renewal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_configurations', function (Blueprint $table) {
            $table->dropColumn(['type', 'auto_renewal', 'logo']);
        });
    }
};
