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
        $channels = [];
        if ($notifiable->prefersNotification('ticket_assigned', 'in_app')) {
            $channels[] = 'database';
        }
        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = 'webpush';
        }
        return $channels;
    }

    public function toWebPush(object $notifiable): array
    {
        return $this->toArray($notifiable);
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
