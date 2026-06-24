<?php
declare(strict_types=1);
namespace App\Notifications;

use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class ReplyReceivedNotification extends Notification
{
    public function __construct(
        private readonly Ticket      $ticket,
        private readonly TicketReply $reply,
        private readonly User        $actor,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'event' => 'reply_received',
            'title' => "New reply on {$this->ticket->ticket_number}",
            'body'  => Str::limit(strip_tags($this->reply->body), 80),
            'url'   => "/tickets/{$this->ticket->id}",
        ];
    }
}
