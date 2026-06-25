<?php
declare(strict_types=1);
namespace App\Notifications;

use App\Models\Ticket;
use Illuminate\Notifications\Notification;

class SLAWarningNotification extends Notification
{
    public function __construct(
        private readonly Ticket $ticket,
        private readonly string $type,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = [];
        if ($notifiable->prefersNotification('sla_warning', 'in_app')) {
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
        $label = $this->type === 'first_response' ? 'First Response' : 'Resolution';
        return [
            'event' => 'sla_warning',
            'title' => "SLA warning: {$this->ticket->ticket_number}",
            'body'  => "{$label} SLA at 75% — action needed soon",
            'url'   => "/tickets/{$this->ticket->id}",
        ];
    }
}
