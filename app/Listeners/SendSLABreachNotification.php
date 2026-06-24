<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\SLABreached;
use App\Jobs\SendTicketEmail;
use App\Models\TicketNote;
use App\Notifications\SLABreachedNotification;

class SendSLABreachNotification
{
    public function handle(SLABreached $event): void
    {
        $ticket = $event->ticket->load(['assignee', 'requester', 'status']);
        $type   = $event->type; // 'first_response' | 'resolution'

        // In-app: add a system note visible in the ticket timeline
        $label = $type === 'first_response' ? 'First-response SLA' : 'Resolution SLA';
        TicketNote::create([
            'ticket_id' => $ticket->id,
            'user_id'   => null,
            'body'      => "<p><strong>⚠ {$label} breached</strong> — this ticket has exceeded its SLA target.</p>",
            'is_html'   => true,
        ]);

        // Email + in-app: alert the assignee
        if ($ticket->assignee) {
            SendTicketEmail::dispatch(
                ticket:          $ticket,
                event:           'sla_breached',
                recipientEmail:  $ticket->assignee->email,
                recipientName:   $ticket->assignee->name,
                extra:           ['sla_type' => $type, 'sla_label' => $label],
            );

            $ticket->assignee->notify(new SLABreachedNotification($ticket, $type));
        }
    }
}
