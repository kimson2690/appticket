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
        Schema::create('daily_menus', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // menu_xxx
            $table->string('restaurant_id', 50);
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['daily', 'weekly'])->default('daily');
            $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])->nullable();
            $table->date('valid_from');
            $table->date('valid_until');
            $table->decimal('price', 10, 2);
            $table->boolean('is_available')->default(true);
            $table->json('items'); // Array of menu items
            $table->timestamps();
            
            // Index
            $table->index('restaurant_id');
            $table->index('type');
            $table->index('day_of_week');
            $table->index('is_available');
            $table->index(['valid_from', 'valid_until']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_menus');
    }
};
