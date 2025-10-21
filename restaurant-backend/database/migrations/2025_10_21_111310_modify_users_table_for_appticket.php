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
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->after('id');
            $table->string('last_name', 100)->after('first_name');
            $table->string('phone', 50)->nullable()->after('email');
            $table->foreignId('role_id')->after('phone')->constrained('roles')->onDelete('cascade');
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending')->after('role_id');
            $table->foreignId('company_id')->nullable()->after('status')->constrained('companies')->onDelete('set null');
            $table->foreignId('restaurant_id')->nullable()->after('company_id')->constrained('restaurants')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->after('restaurant_id')->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['restaurant_id']);
            $table->dropForeign(['company_id']);
            $table->dropForeign(['role_id']);
            $table->dropColumn(['first_name', 'last_name', 'phone', 'role_id', 'status', 'company_id', 'restaurant_id', 'created_by']);
        });
    }
};
