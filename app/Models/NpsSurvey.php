<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NpsSurvey extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email',
        'token',
        'score',
        'comment',
        'sent_at',
        'responded_at',
    ];

    protected $casts = [
        'score'        => 'integer',
        'sent_at'      => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        $expiryDays = config('ticketing.satisfaction.survey_token_expiry_days', 7);

        return $this->sent_at !== null
            && $this->sent_at->addDays($expiryDays)->isPast();
    }

    public function hasResponded(): bool
    {
        return $this->responded_at !== null;
    }

    /** Promoter: 9–10 | Passive: 7–8 | Detractor: 0–6 */
    public function category(): string
    {
        return match (true) {
            $this->score >= 9 => 'promoter',
            $this->score >= 7 => 'passive',
            default           => 'detractor',
        };
    }
}
