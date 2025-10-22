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
            $table->string('department', 100)->nullable()->after('phone');
            $table->string('position', 100)->nullable()->after('department');
            $table->string('employee_number', 50)->nullable()->unique()->after('position');
            $table->integer('ticket_balance')->default(0)->after('employee_number');
            $table->date('hire_date')->nullable()->after('ticket_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['department', 'position', 'employee_number', 'ticket_balance', 'hire_date']);
        });
    }
};
