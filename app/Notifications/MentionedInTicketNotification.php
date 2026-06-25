<?php
declare(strict_types=1);
namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Notifications\Notification;

class MentionedInTicketNotification extends Notification
{
    public function __construct(
        private readonly Ticket $ticket,
        private readonly User   $actor,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = [];
        if ($notifiable->prefersNotification('mention', 'in_app')) {
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
            'event' => 'mention',
            'title' => "You were mentioned in {$this->ticket->ticket_number}",
            'body'  => "By {$this->actor->name}",
            'url'   => "/tickets/{$this->ticket->id}",
        ];
    }
}
