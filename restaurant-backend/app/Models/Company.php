<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'name',
        'type',
        'address',
        'phone',
        'email',
        'manager_id',
        'ticket_value',
        'ticket_validity_days'
    ];

    protected $casts = [
        'ticket_value' => 'decimal:2',
        'ticket_validity_days' => 'integer',
    ];

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function restaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class);
    }

    public function ticketBatches(): HasMany
    {
        return $this->hasMany(TicketBatch::class);
    }

    public function deliveryPlaces(): HasMany
    {
        return $this->hasMany(DeliveryPlace::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
