<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $table = 'orders';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'employee_id',
        'employee_name',
        'restaurant_id',
        'items', // JSON
        'total_amount',
        'ticket_amount_used',
        'status',
        'delivery_location_id',
        'delivery_address',
        'notes',
        'confirmed_by',
        'confirmed_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason'
    ];

    protected $casts = [
        'items' => 'array',
        'total_amount' => 'decimal:2',
        'ticket_amount_used' => 'decimal:2',
        'confirmed_at' => 'datetime',
        'rejected_at' => 'datetime'
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class, 'restaurant_id', 'id');
    }

    public function deliveryLocation(): BelongsTo
    {
        return $this->belongsTo(DeliveryLocation::class, 'delivery_location_id', 'id');
    }
}
