<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketBatch extends Model
{
    protected $fillable = [
        'company_id',
        'created_by',
        'total_tickets',
        'ticket_value',
        'type',
        'validity_start',
        'validity_end'
    ];

    protected $casts = [
        'ticket_value' => 'decimal:2',
        'total_tickets' => 'integer',
        'validity_start' => 'date',
        'validity_end' => 'date',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function userTickets(): HasMany
    {
        return $this->hasMany(UserTicket::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('validity_end', '>=', now());
    }

    public function scopeExpired($query)
    {
        return $query->where('validity_end', '<', now());
    }
}
