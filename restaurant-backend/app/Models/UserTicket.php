<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class UserTicket extends Model
{
    protected $table = 'user_tickets';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    
    protected $fillable = [
        'id',
        'employee_id',
        'employee_name',
        'batch_id',
        'tickets_count',
        'ticket_value',
        'type',
        'assigned_by',
        'notes',
        'created_at'
    ];

    protected $casts = [
        'ticket_value' => 'decimal:2',
        'created_at' => 'datetime'
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
}
