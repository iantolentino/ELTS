<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CannedResponse extends Model
{
    protected $fillable = [
        'title', 'body', 'scope', 'user_id', 'team_id', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function scopeVisibleTo($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('scope', 'global')
                ->orWhere(function ($q2) use ($user) {
                    $q2->where('scope', 'team')->where('team_id', $user->team_id);
                })
                ->orWhere(function ($q2) use ($user) {
                    $q2->where('scope', 'personal')->where('user_id', $user->id);
                });
        })->where('is_active', true);
    }
}
