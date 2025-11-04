<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    
    protected $fillable = [
        'id',
        'type',
        'title',
        'message',
        'user_id',
        'role',
        'company_id',
        'restaurant_id',
        'action_url',
        'metadata',
        'read',
        'read_at',
        'created_at'
    ];

    protected $casts = [
        'read' => 'boolean',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'metadata' => 'array'
    ];
}
