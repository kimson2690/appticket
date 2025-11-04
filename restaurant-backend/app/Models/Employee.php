<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    protected $table = 'employees';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id',
        'name',
        'email',
        'phone',
        'password',
        'company_id',
        'company_name',
        'department',
        'position',
        'employee_number',
        'ticket_balance',
        'status',
        'hire_date'
    ];
    
    protected $hidden = [
        'password'
    ];
    
    protected $casts = [
        'ticket_balance' => 'decimal:2',
        'hire_date' => 'date'
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id', 'id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'employee_id', 'id');
    }

    public function userTickets(): HasMany
    {
        return $this->hasMany(UserTicket::class, 'employee_id', 'id');
    }
}
