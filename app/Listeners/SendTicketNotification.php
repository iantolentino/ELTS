<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Events\TicketReplied;
use App\Events\TicketStatusChanged;
use App\Jobs\SendTicketEmail;

class SendTicketNotification
{
    public function handleTicketCreated(TicketCreated $event): void
    {
        $ticket = $event->ticket->load(['requester', 'status', 'category']);

        SendTicketEmail::dispatch(
            $ticket,
            'ticket_created',
            $ticket->requester->email,
            $ticket->requester->name,
        );
    }

    public function handleTicketReplied(TicketReplied $event): void
    {
        $ticket = $event->ticket->load(['requester', 'status']);
        $reply  = $event->reply;
        $actor  = $event->actor;

        // Notify requester when agent replies (not when requester replies to themselves)
        if ($actor->id !== $ticket->requester_id) {
            $extra = [
                'reply_body' => $reply->body,
                'agent_name' => $actor->name,
            ];

            $cc = [];
            if ($reply->cc) {
                $cc = array_filter(array_map('trim', explode(',', $reply->cc)));
            }

            SendTicketEmail::dispatch(
                $ticket,
                'reply_received',
                $ticket->requester->email,
                $ticket->requester->name,
                $extra,
                $cc,
            );
        }
    }

    public function handleTicketStatusChanged(TicketStatusChanged $event): void
    {
        $ticket = $event->ticket->load(['requester', 'status']);

        if ($event->isNowResolved) {
            SendTicketEmail::dispatch(
                $ticket,
                'ticket_resolved',
                $ticket->requester->email,
                $ticket->requester->name,
            );
        } elseif ($event->isNowClosed) {
            SendTicketEmail::dispatch(
                $ticket,
                'ticket_closed',
                $ticket->requester->email,
                $ticket->requester->name,
            );
        }
    }

    public function handleTicketAssigned(TicketAssigned $event): void
    {
        $ticket   = $event->ticket->load(['requester', 'status']);
        $assignee = $event->assignee;

        SendTicketEmail::dispatch(
            $ticket,
            'ticket_assigned',
            $assignee->email,
            $assignee->name,
            ['assignee_name' => $assignee->name],
        );
    }
}
