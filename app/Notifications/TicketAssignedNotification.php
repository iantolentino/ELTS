<?php
declare(strict_types=1);
namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Notifications\Notification;

class TicketAssignedNotification extends Notification
{
    public function __construct(
        private readonly Ticket $ticket,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'event' => 'ticket_assigned',
            'title' => 'Ticket assigned to you',
            'body'  => "{$this->ticket->ticket_number}: {$this->ticket->subject}",
            'url'   => "/tickets/{$this->ticket->id}",
        ];
    }
}
