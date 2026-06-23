<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CsatSurvey extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
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

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

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
}
