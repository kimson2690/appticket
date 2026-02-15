<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewItem extends Model
{
    protected $table = 'review_items';

    protected $fillable = [
        'review_id',
        'menu_item_id',
        'menu_item_name',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function review(): BelongsTo
    {
        return $this->belongsTo(Review::class, 'review_id', 'id');
    }
}
