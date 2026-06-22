<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncomingEmail extends Model
{
    use HasFactory;

    protected $fillable = [
        'mailbox_id',
        'ticket_id',
        'message_id',
        'from_email',
        'from_name',
        'to_email',
        'subject',
        'body_text',
        'body_html',
        'attachments',
        'status',
        'failure_reason',
        'received_at',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'attachments'  => 'array',
            'received_at'  => 'datetime',
            'processed_at' => 'datetime',
        ];
    }

    public function mailbox(): BelongsTo
    {
        return $this->belongsTo(Mailbox::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isProcessed(): bool
    {
        return $this->status === 'processed';
    }
}
