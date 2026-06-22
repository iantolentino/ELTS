<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Repositories\TicketRepositoryInterface;
use App\Jobs\SendTicketEmail;
use App\Models\AutomationRule;
use App\Models\Ticket;
use App\Models\TicketNote;
use App\Models\TicketStatus;
use App\Models\TicketTag;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AutomationService
{
    public function __construct(
        private readonly TicketRepositoryInterface $ticketRepository,
    ) {}

    public function evaluate(Ticket $ticket, string $event): void
    {
        $rules = AutomationRule::with(['conditions', 'actions'])
            ->active()
            ->where('event', $event)
            ->orderBy('sort_order')
            ->get();

        foreach ($rules as $rule) {
            if ($this->matchesConditions($ticket, $rule)) {
                $this->applyActions($ticket, $rule);
                $ticket->refresh();
            }
        }
    }

    private function matchesConditions(Ticket $ticket, AutomationRule $rule): bool
    {
        $ticket->loadMissing(['status', 'category', 'assignee', 'team', 'tags', 'requester']);

        $results = $rule->conditions->map(
            fn ($c) => $this->evaluateCondition($ticket, $c->field, $c->operator, $c->value)
        );

        if ($results->isEmpty()) {
            return true;
        }

        return $rule->match_type === 'all'
            ? $results->every(fn ($r) => $r)
            : $results->contains(fn ($r) => $r);
    }

    private function evaluateCondition(Ticket $ticket, string $field, string $operator, ?string $value): bool
    {
        $actual = $this->extractField($ticket, $field);

        return match ($operator) {
            'equals'        => $this->cmp($actual, '==', $value),
            'not_equals'    => $this->cmp($actual, '!=', $value),
            'contains'      => $actual !== null && str_contains(strtolower($actual), strtolower((string) $value)),
            'not_contains'  => $actual === null || !str_contains(strtolower($actual), strtolower((string) $value)),
            'starts_with'   => $actual !== null && str_starts_with(strtolower($actual), strtolower((string) $value)),
            'ends_with'     => $actual !== null && str_ends_with(strtolower($actual), strtolower((string) $value)),
            'is_empty'      => $actual === null || $actual === '',
            'is_not_empty'  => $actual !== null && $actual !== '',
            default         => false,
        };
    }

    private function cmp(?string $a, string $op, ?string $b): bool
    {
        $a = strtolower((string) $a);
        $b = strtolower((string) $b);

        return match ($op) {
            '==' => $a === $b,
            '!=' => $a !== $b,
            default => false,
        };
    }

    private function extractField(Ticket $ticket, string $field): ?string
    {
        return match ($field) {
            'status'          => $ticket->status?->name,
            'priority'        => $ticket->priority,
            'category'        => $ticket->category?->name,
            'tag'             => $ticket->tags->pluck('name')->implode(','),
            'subject'         => $ticket->subject,
            'description'     => strip_tags((string) $ticket->description),
            'requester_email' => $ticket->requester?->email,
            'assignee'        => $ticket->assignee?->name,
            'team'            => $ticket->team?->name,
            'source'          => $ticket->source,
            'is_vip'          => $ticket->is_vip ? 'true' : 'false',
            default           => null,
        };
    }

    private function applyActions(Ticket $ticket, AutomationRule $rule): void
    {
        foreach ($rule->actions as $action) {
            try {
                $this->applyAction($ticket, $action->action_type, $action->value);
            } catch (\Throwable $e) {
                Log::warning("Automation action [{$action->action_type}] failed for ticket #{$ticket->id}: {$e->getMessage()}");
            }
        }
    }

    private function applyAction(Ticket $ticket, string $type, ?string $value): void
    {
        match ($type) {
            'assign_to'          => $this->actionAssignTo($ticket, (int) $value),
            'assign_round_robin' => $this->actionAssignRoundRobin($ticket),
            'assign_by_skill'    => $this->actionAssignBySkill($ticket),
            'add_tag'            => $this->actionAddTag($ticket, (string) $value),
            'remove_tag'         => $this->actionRemoveTag($ticket, (string) $value),
            'change_status'      => $this->actionChangeStatus($ticket, (int) $value),
            'change_priority'    => $this->actionChangePriority($ticket, (string) $value),
            'send_notification'  => $this->actionSendNotification($ticket, (string) $value),
            'add_note'           => $this->actionAddNote($ticket, (string) $value),
            'close'              => $this->actionClose($ticket),
            'escalate'           => $this->actionEscalate($ticket),
            default              => null,
        };
    }

    private function actionAssignTo(Ticket $ticket, int $userId): void
    {
        $this->ticketRepository->update($ticket, ['assignee_id' => $userId]);
    }

    private function actionAssignRoundRobin(Ticket $ticket): void
    {
        $agents = User::role(['agent', 'supervisor'])
            ->whereIn('availability_status', ['online', 'busy'])
            ->get(['id']);

        if ($agents->isEmpty()) {
            $agents = User::role(['agent', 'supervisor'])->get(['id']);
        }

        if ($agents->isEmpty()) {
            return;
        }

        $agentIds   = $agents->pluck('id');
        $openCounts = Ticket::whereIn('assignee_id', $agentIds)
            ->whereHas('status', fn ($q) => $q->where('is_closed', false))
            ->selectRaw('assignee_id, COUNT(*) as cnt')
            ->groupBy('assignee_id')
            ->pluck('cnt', 'assignee_id');

        $chosen = $agents->sortBy(fn ($a) => $openCounts->get($a->id, 0))->first();

        if ($chosen) {
            $this->ticketRepository->update($ticket, ['assignee_id' => $chosen->id]);
        }
    }

    private function actionAssignBySkill(Ticket $ticket): void
    {
        $ticket->loadMissing('tags');
        $tagNames = $ticket->tags->pluck('name')->map(fn ($n) => strtolower($n))->all();

        if (empty($tagNames)) {
            $this->actionAssignRoundRobin($ticket);
            return;
        }

        $agents = User::role(['agent', 'supervisor'])
            ->whereNotNull('skills')
            ->get(['id', 'skills']);

        $matching = $agents->filter(function ($agent) use ($tagNames) {
            $skills = array_map('strtolower', (array) ($agent->skills ?? []));
            return count(array_intersect($skills, $tagNames)) > 0;
        });

        if ($matching->isEmpty()) {
            $this->actionAssignRoundRobin($ticket);
            return;
        }

        $agentIds   = $matching->pluck('id');
        $openCounts = Ticket::whereIn('assignee_id', $agentIds)
            ->whereHas('status', fn ($q) => $q->where('is_closed', false))
            ->selectRaw('assignee_id, COUNT(*) as cnt')
            ->groupBy('assignee_id')
            ->pluck('cnt', 'assignee_id');

        $chosen = $matching->sortBy(fn ($a) => $openCounts->get($a->id, 0))->first();

        if ($chosen) {
            $this->ticketRepository->update($ticket, ['assignee_id' => $chosen->id]);
        }
    }

    private function actionAddTag(Ticket $ticket, string $tagName): void
    {
        $tag = TicketTag::firstOrCreate(['name' => $tagName], ['color' => '#6b7280']);
        $ticket->tags()->syncWithoutDetaching([$tag->id]);
    }

    private function actionRemoveTag(Ticket $ticket, string $tagName): void
    {
        $tag = TicketTag::where('name', $tagName)->first();
        if ($tag) {
            $ticket->tags()->detach($tag->id);
        }
    }

    private function actionChangeStatus(Ticket $ticket, int $statusId): void
    {
        $status  = TicketStatus::find($statusId);
        $updates = ['status_id' => $statusId];

        if ($status?->is_closed && $ticket->closed_at === null) {
            $updates['closed_at'] = now();
        } elseif (!$status?->is_closed) {
            $updates['closed_at'] = null;
        }

        $this->ticketRepository->update($ticket, $updates);
    }

    private function actionChangePriority(Ticket $ticket, string $priority): void
    {
        $this->ticketRepository->update($ticket, ['priority' => $priority]);
    }

    private function actionSendNotification(Ticket $ticket, string $message): void
    {
        $ticket->loadMissing('requester');
        if (!$ticket->requester) {
            return;
        }

        $fresh = $ticket->fresh(['requester', 'status', 'assignee']);
        SendTicketEmail::dispatch(
            $fresh,
            'automation_notification',
            $ticket->requester->email,
            $ticket->requester->name,
            ['automation_message' => $message],
        );
    }

    private function actionAddNote(Ticket $ticket, string $body): void
    {
        TicketNote::create([
            'ticket_id' => $ticket->id,
            'user_id'   => null,
            'body'      => '[Automation] ' . $body,
            'is_html'   => false,
        ]);
    }

    private function actionClose(Ticket $ticket): void
    {
        $closedStatus = TicketStatus::where('is_closed', true)->orderBy('sort_order')->first();
        if ($closedStatus && $ticket->status_id !== $closedStatus->id) {
            $this->ticketRepository->update($ticket, [
                'status_id' => $closedStatus->id,
                'closed_at' => now(),
            ]);
        }
    }

    private function actionEscalate(Ticket $ticket): void
    {
        $this->ticketRepository->update($ticket, ['priority' => 'critical']);

        $fresh       = $ticket->fresh(['requester', 'status', 'assignee']);
        $supervisors = User::role(['supervisor', 'admin'])->get();

        foreach ($supervisors as $supervisor) {
            SendTicketEmail::dispatch(
                $fresh,
                'ticket_escalated',
                $supervisor->email,
                $supervisor->name,
            );
        }
    }
}
