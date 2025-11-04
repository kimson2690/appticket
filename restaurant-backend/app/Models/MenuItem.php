<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $table = 'menu_items';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id',
        'restaurant_id',
        'restaurant_name',
        'name',
        'description',
        'price',
        'category',
        'image_url',
        'available',
        'is_popular',
        'preparation_time',
        'allergens',
        'ingredients',
        'created_by'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'available' => 'boolean',
        'is_popular' => 'boolean',
        'allergens' => 'array',
        'ingredients' => 'array'
    ];
}
