<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Ticket extends Model
{
    use SoftDeletes, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['status_id', 'priority', 'assignee_id', 'team_id', 'category_id', 'subject'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'ticket_number',
        'subject',
        'description',
        'status_id',
        'priority',
        'category_id',
        'requester_id',
        'assignee_id',
        'team_id',
        'parent_ticket_id',
        'merged_into_id',
        'source',
        'is_vip',
        'due_at',
        'first_response_at',
        'resolved_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_vip'            => 'boolean',
            'due_at'            => 'datetime',
            'first_response_at' => 'datetime',
            'resolved_at'       => 'datetime',
            'closed_at'         => 'datetime',
        ];
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(TicketStatus::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TicketCategory::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function parentTicket(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_ticket_id');
    }

    public function childTickets(): HasMany
    {
        return $this->hasMany(self::class, 'parent_ticket_id');
    }

    public function mergedInto(): BelongsTo
    {
        return $this->belongsTo(self::class, 'merged_into_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TicketReply::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(TicketNote::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(TicketTag::class, 'ticket_tag_pivot', 'ticket_id', 'tag_id');
    }

    public function watchers(): HasMany
    {
        return $this->hasMany(TicketWatcher::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function customFieldValues(): HasMany
    {
        return $this->hasMany(CustomFieldValue::class);
    }
}
