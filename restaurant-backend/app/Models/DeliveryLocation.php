<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryLocation extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'address',
        'building',
        'floor',
        'instructions',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Relation avec Company
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Relation avec Orders
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
