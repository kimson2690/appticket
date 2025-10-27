<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'restaurant_id',
        'company_id',
        'delivery_location_id',
        'total_amount',
        'total_tickets',
        'status',
        'validated_at',
        'delivered_at',
    ];

    protected $casts = [
        'validated_at' => 'datetime',
        'delivered_at' => 'datetime',
        'total_amount' => 'decimal:2',
    ];

    /**
     * Relation avec User (employé qui passe la commande)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec Restaurant
     */
    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    /**
     * Relation avec Company
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Relation avec DeliveryLocation
     */
    public function deliveryLocation(): BelongsTo
    {
        return $this->belongsTo(DeliveryLocation::class);
    }

    /**
     * Relation avec OrderItems
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
