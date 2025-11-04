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
        // Disable foreign key checks
        Schema::disableForeignKeyConstraints();
        
        // Drop old tables
        Schema::dropIfExists('menu_dishes');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('dishes');
        
        // Create menu_items table
        Schema::create('menu_items', function (Blueprint $table) {
            $table->string('id', 50)->primary(); // menu_xxx
            $table->string('restaurant_id', 50);
            $table->string('restaurant_name');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->string('category')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('available')->default(true);
            $table->boolean('is_popular')->default(false);
            $table->integer('preparation_time')->nullable(); // in minutes
            $table->json('allergens')->nullable();
            $table->json('ingredients')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();
            
            // Index
            $table->index('restaurant_id');
            $table->index('category');
            $table->index('available');
            $table->index('is_popular');
            $table->index(['name', 'restaurant_id']);
        });
        
        // Re-enable foreign key checks
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
