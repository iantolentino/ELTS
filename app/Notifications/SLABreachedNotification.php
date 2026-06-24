<?php
declare(strict_types=1);
namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Notifications\Notification;

class SLABreachedNotification extends Notification
{
    public function __construct(
        private readonly Ticket $ticket,
        private readonly string $type,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $label = $this->type === 'first_response' ? 'First Response' : 'Resolution';
        return [
            'event' => 'sla_breach',
            'title' => "SLA breached: {$this->ticket->ticket_number}",
            'body'  => "{$label} SLA exceeded — immediate action required",
            'url'   => "/tickets/{$this->ticket->id}",
        ];
    }
}
