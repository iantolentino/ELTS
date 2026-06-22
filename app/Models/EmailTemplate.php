<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $fillable = ['event_name', 'subject', 'body', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public static array $events = [
        'ticket_created'  => 'Ticket Created (sent to requester)',
        'reply_received'  => 'Reply Received (sent to requester)',
        'ticket_resolved' => 'Ticket Resolved (sent to requester)',
        'ticket_closed'   => 'Ticket Closed (sent to requester)',
        'ticket_assigned' => 'Ticket Assigned (sent to assignee)',
    ];

    public static array $variables = [
        '{{ticket_number}}',
        '{{ticket_subject}}',
        '{{requester_name}}',
        '{{requester_email}}',
        '{{assignee_name}}',
        '{{priority}}',
        '{{status}}',
        '{{ticket_url}}',
        '{{app_name}}',
        '{{reply_body}}',
    ];
}
