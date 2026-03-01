<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Ajouter ordering_enabled sur companies
        Schema::table('companies', function (Blueprint $table) {
            $table->boolean('ordering_enabled')->default(true)->after('status');
        });

        // Créer la table des paiements directs
        Schema::create('direct_payments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('employee_id');
            $table->string('employee_name');
            $table->unsignedBigInteger('restaurant_id');
            $table->unsignedBigInteger('company_id');
            $table->decimal('amount', 10, 2);
            $table->decimal('ticket_amount_used', 10, 2);
            $table->string('reference')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['completed', 'cancelled', 'refunded'])->default('completed');
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('restaurant_id')->references('id')->on('restaurants')->onDelete('cascade');
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');

            $table->index(['employee_id', 'created_at']);
            $table->index(['restaurant_id', 'created_at']);
            $table->index(['company_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('direct_payments');

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('ordering_enabled');
        });
    }
};
