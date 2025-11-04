<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketBatch extends Model
{
    protected $table = 'ticket_batches';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id',
        'batch_number',
        'company_id',
        'config_id',
        'employee_id',
        'employee_name',
        'created_by',
        'total_tickets',
        'ticket_value',
        'type',
        'validity_start',
        'validity_end',
        'assigned_tickets',
        'used_tickets',
        'remaining_tickets',
        'status',
        'tickets' // JSON
    ];

    protected $casts = [
        'ticket_value' => 'decimal:2',
        'validity_start' => 'date',
        'validity_end' => 'date',
        'tickets' => 'array'
    ];
}
