<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 50)->unique();
            $table->string('employee_id', 50)->index();
            $table->unsignedBigInteger('restaurant_id')->index();
            $table->tinyInteger('overall_rating')->unsigned(); // 1-5
            $table->tinyInteger('food_rating')->unsigned()->nullable(); // 1-5
            $table->tinyInteger('service_rating')->unsigned()->nullable(); // 1-5
            $table->text('comment')->nullable();
            $table->boolean('is_anonymous')->default(false);
            $table->timestamps();

            $table->index(['restaurant_id', 'created_at']);
            $table->index(['employee_id', 'created_at']);
        });

        Schema::create('review_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('review_id');
            $table->string('menu_item_id', 50);
            $table->string('menu_item_name', 255);
            $table->tinyInteger('rating')->unsigned(); // 1-5
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->foreign('review_id')->references('id')->on('reviews')->onDelete('cascade');
            $table->index(['menu_item_id', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_items');
        Schema::dropIfExists('reviews');
    }
};
