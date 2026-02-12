<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetToken extends Model
{
    protected $table = 'password_reset_tokens';

    public $incrementing = false;
    protected $primaryKey = 'email';
    protected $keyType = 'string';

    const UPDATED_AT = null;

    protected $fillable = [
        'email',
        'token',
        'expires_at',
        'user_type'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime'
    ];
}
