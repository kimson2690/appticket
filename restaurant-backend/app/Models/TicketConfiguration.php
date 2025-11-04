<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketConfiguration extends Model
{
    protected $table = 'ticket_configurations';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id',
        'company_id',
        'company_name',
        'ticket_value',
        'monthly_allocation',
        'validity_days',
        'rollover_unused',
        'max_order_amount',
        'allowed_days',
        'start_time',
        'end_time',
        'weekend_usage',
        'restrictions',
        'status'
    ];

    protected $casts = [
        'ticket_value' => 'decimal:2',
        'max_order_amount' => 'decimal:2',
        'rollover_unused' => 'boolean',
        'weekend_usage' => 'boolean',
        'allowed_days' => 'array'
    ];
}
