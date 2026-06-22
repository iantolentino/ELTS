<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Mailbox extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'host',
        'port',
        'encryption',
        'username',
        'password',
        'mailbox_folder',
        'is_active',
        'last_polled_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'password'       => 'encrypted',
            'port'           => 'integer',
            'is_active'      => 'boolean',
            'last_polled_at' => 'datetime',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function incomingEmails(): HasMany
    {
        return $this->hasMany(IncomingEmail::class);
    }
}
