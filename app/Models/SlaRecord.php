<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SlaRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_id',
        'sla_policy_id',
        'first_response_due',
        'resolution_due',
        'first_response_breached',
        'first_response_warning_sent',
        'resolution_breached',
        'resolution_warning_sent',
        'first_response_met_at',
        'resolution_met_at',
        'paused_at',
        'paused_minutes',
    ];

    protected function casts(): array
    {
        return [
            'first_response_due'          => 'datetime',
            'resolution_due'              => 'datetime',
            'first_response_breached'     => 'boolean',
            'first_response_warning_sent' => 'boolean',
            'resolution_breached'         => 'boolean',
            'resolution_warning_sent'     => 'boolean',
            'first_response_met_at'       => 'datetime',
            'resolution_met_at'           => 'datetime',
            'paused_at'                   => 'datetime',
            'paused_minutes'              => 'integer',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function policy(): BelongsTo
    {
        return $this->belongsTo(SlaPolicy::class, 'sla_policy_id');
    }

    public function isPaused(): bool
    {
        return $this->paused_at !== null;
    }

    /**
     * SLA status for display: 'ok' | 'warning' | 'breached' | 'met'
     * Uses resolution SLA as the primary indicator.
     */
    public function resolutionStatus(): string
    {
        if ($this->resolution_met_at) {
            return 'met';
        }
        if ($this->resolution_breached) {
            return 'breached';
        }
        if ($this->resolution_due && now()->gt($this->resolution_due->subMinutes(30))) {
            return 'warning';
        }
        return 'ok';
    }
}
