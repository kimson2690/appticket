<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Review extends Model
{
    protected $table = 'reviews';

    protected $fillable = [
        'order_id',
        'employee_id',
        'restaurant_id',
        'overall_rating',
        'food_rating',
        'service_rating',
        'comment',
        'is_anonymous',
    ];

    protected $casts = [
        'overall_rating' => 'integer',
        'food_rating' => 'integer',
        'service_rating' => 'integer',
        'is_anonymous' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class, 'restaurant_id', 'id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReviewItem::class, 'review_id', 'id');
    }
}
