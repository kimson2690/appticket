<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyMenu extends Model
{
    protected $table = 'daily_menus';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id',
        'restaurant_id',
        'name',
        'description',
        'type',
        'day_of_week',
        'valid_from',
        'valid_until',
        'price',
        'is_available',
        'items'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
        'valid_from' => 'date',
        'valid_until' => 'date',
        'items' => 'array'
    ];
}
