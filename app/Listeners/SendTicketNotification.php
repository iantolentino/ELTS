<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Events\TicketReplied;
use App\Events\TicketStatusChanged;
use App\Jobs\SendCSATSurvey;
use App\Jobs\SendTicketEmail;
use App\Models\User;
use App\Notifications\MentionedInTicketNotification;
use App\Notifications\ReplyReceivedNotification;
use App\Notifications\TicketAssignedNotification;

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
        $ticket = $event->ticket->load(['requester', 'status', 'watchers']);
        $reply  = $event->reply;
        $actor  = $event->actor;

        // Notify requester when agent replies
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

            $ticket->requester->notify(new ReplyReceivedNotification($ticket, $reply, $actor));
        }

        // Notify watchers (excluding the reply actor and the requester)
        $watcherUserIds = $ticket->watchers->pluck('user_id')->filter()->toArray();
        if (count($watcherUserIds) > 0) {
            User::whereIn('id', $watcherUserIds)
                ->where('id', '!=', $actor->id)
                ->where('id', '!=', $ticket->requester_id)
                ->get()
                ->each(fn (User $u) => $u->notify(new ReplyReceivedNotification($ticket, $reply, $actor)));
        }

        // Notify @mentioned users
        $mentionedIds = $this->extractMentionIds($reply->body);
        if (count($mentionedIds) > 0) {
            User::whereIn('id', $mentionedIds)
                ->where('id', '!=', $actor->id)
                ->get()
                ->each(fn (User $u) => $u->notify(new MentionedInTicketNotification($ticket, $actor)));
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

            $delayHours = config('ticketing.satisfaction.csat_delay_hours', 1);
            SendCSATSurvey::dispatch($ticket)->delay(now()->addHours($delayHours));
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

        $assignee->notify(new TicketAssignedNotification($ticket));
    }

    private function extractMentionIds(string $html): array
    {
        preg_match_all('/data-id=["\'](\d+)["\']/', $html, $matches);
        return array_map('intval', array_unique($matches[1]));
    }
}
