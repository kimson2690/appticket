<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class UserTicket extends Model
{
    protected $fillable = [
        'user_id',
        'ticket_batch_id',
        'code',
        'value',
        'status',
        'assigned_at',
        'used_at'
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'assigned_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ticketBatch(): BelongsTo
    {
        return $this->belongsTo(TicketBatch::class);
    }

    // Scopes
    public function scopeValid($query)
    {
        return $query->where('status', 'valide');
    }

    public function scopeUsed($query)
    {
        return $query->where('status', 'utilisé');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expiré');
    }

    // Methods
    public function markAsUsed()
    {
        $this->update([
            'status' => 'utilisé',
            'used_at' => now()
        ]);
    }

    public function isValid(): bool
    {
        return $this->status === 'valide' && 
               $this->ticketBatch->validity_end >= now();
    }

    // Boot method for auto-generating code
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($ticket) {
            if (!$ticket->code) {
                $ticket->code = 'TKT-' . strtoupper(Str::random(8));
            }
            if (!$ticket->assigned_at) {
                $ticket->assigned_at = now();
            }
        });
    }
}
