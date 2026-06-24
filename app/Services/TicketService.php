<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Repositories\TicketRepositoryInterface;
use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Events\TicketReplied;
use App\Events\TicketStatusChanged;
use App\Jobs\RunAutomationRules;
use App\Notifications\MentionedInTicketNotification;
use App\Services\SLAService;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketNote;
use App\Models\TicketReply;
use App\Models\TicketStatus;
use App\Models\TicketWatcher;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TicketService
{
    public function __construct(
        private readonly TicketRepositoryInterface $ticketRepository,
        private readonly SLAService $slaService,
    ) {}

    public function listTickets(array $params, User $actor): LengthAwarePaginator
    {
        if ($actor->hasRole('client')) {
            $params['requester_id'] = $actor->id;
        }

        return $this->ticketRepository->paginate($params);
    }

    public function createTicket(array $data, User $requester): Ticket
    {
        $defaultStatus = TicketStatus::where('is_default', true)->first();

        $ticket = $this->ticketRepository->create([
            'ticket_number' => '',
            'subject'       => $data['subject'],
            'description'   => $data['description'],
            'status_id'     => $data['status_id'] ?? $defaultStatus?->id,
            'priority'      => $data['priority'] ?? 'medium',
            'category_id'   => $data['category_id'] ?? null,
            'requester_id'  => $requester->id,
            'assignee_id'   => $data['assignee_id'] ?? null,
            'team_id'       => $data['team_id'] ?? null,
            'source'        => $data['source'] ?? 'web',
            'is_vip'        => $data['is_vip'] ?? false,
            'due_at'        => $data['due_at'] ?? null,
        ]);

        $prefix = config('ticketing.tickets.number_prefix', 'TKT');
        $this->ticketRepository->update($ticket, [
            'ticket_number' => $prefix . '-' . str_pad((string) $ticket->id, 5, '0', STR_PAD_LEFT),
        ]);

        $ticket = $ticket->refresh();
        TicketCreated::dispatch($ticket);
        $this->slaService->createRecord($ticket);
        RunAutomationRules::dispatch($ticket, 'ticket_created');

        return $ticket;
    }

    public function updateTicket(Ticket $ticket, array $data): Ticket
    {
        $allowed = ['subject', 'description', 'status_id', 'priority', 'category_id', 'assignee_id', 'team_id', 'due_at', 'is_vip'];

        return $this->ticketRepository->update($ticket, array_intersect_key($data, array_flip($allowed)));
    }

    public function closeTicket(Ticket $ticket, User $actor): Ticket
    {
        $closedStatus = TicketStatus::where('is_closed', true)->orderBy('sort_order')->first();

        return $this->ticketRepository->update($ticket, [
            'status_id' => $closedStatus?->id ?? $ticket->status_id,
            'closed_at' => now(),
        ]);
    }

    public function deleteTicket(Ticket $ticket): void
    {
        $this->ticketRepository->delete($ticket);
    }

    public function changeStatus(Ticket $ticket, int $statusId): Ticket
    {
        $status  = TicketStatus::find($statusId);
        $updates = ['status_id' => $statusId];

        if ($status?->is_closed && $ticket->closed_at === null) {
            $updates['closed_at'] = now();
        } elseif (!$status?->is_closed) {
            $updates['closed_at'] = null;
        }

        $wasClosed = (bool) $ticket->status?->is_closed;
        $updated   = $this->ticketRepository->update($ticket, $updates);
        $newStatus = TicketStatus::find($statusId);

        $isNowClosed   = (bool) $newStatus?->is_closed;
        $isNowResolved = !$isNowClosed && strtolower($newStatus?->name ?? '') === 'resolved';

        // Mark SLA resolution on first close/resolve transition
        if (!$wasClosed && ($isNowClosed || $isNowResolved)) {
            $this->slaService->checkResolutionMet($updated->fresh(['slaRecord']));
        }

        // Only fire status change notification on transition (not on every status change)
        if (!$wasClosed) {
            TicketStatusChanged::dispatch(
                $updated->fresh(['status', 'requester']),
                isNowClosed:   $isNowClosed,
                isNowResolved: $isNowResolved,
            );
        }

        RunAutomationRules::dispatch($updated, 'ticket_status_changed');

        return $updated;
    }

    public function changePriority(Ticket $ticket, string $priority): Ticket
    {
        return $this->ticketRepository->update($ticket, ['priority' => $priority]);
    }

    public function assign(Ticket $ticket, ?int $assigneeId, ?int $teamId): Ticket
    {
        $previousAssigneeId = $ticket->assignee_id;
        $updated            = $this->ticketRepository->update($ticket, [
            'assignee_id' => $assigneeId,
            'team_id'     => $teamId,
        ]);

        if ($assigneeId && $assigneeId !== $previousAssigneeId) {
            $assignee = User::find($assigneeId);
            if ($assignee) {
                TicketAssigned::dispatch($updated->fresh(['requester', 'status']), $assignee);
            }
        }

        return $updated;
    }

    public function addReply(Ticket $ticket, array $data, User $actor): TicketReply
    {
        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $actor->id,
            'body'      => $data['body'],
            'is_html'   => true,
            'cc'        => $data['cc'] ?? null,
            'bcc'       => $data['bcc'] ?? null,
        ]);

        if ($ticket->first_response_at === null && $actor->id !== $ticket->requester_id) {
            $this->ticketRepository->update($ticket, ['first_response_at' => now()]);
            $this->slaService->checkFirstResponseMet($ticket->fresh(['slaRecord']));
        }

        TicketReplied::dispatch($ticket, $reply, $actor);
        RunAutomationRules::dispatch($ticket, 'ticket_replied');

        return $reply;
    }

    public function addNote(Ticket $ticket, array $data, User $actor): TicketNote
    {
        $note = TicketNote::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $actor->id,
            'body'      => $data['body'],
            'is_html'   => true,
        ]);

        // Notify @mentioned users in notes
        preg_match_all('/data-id=["\'](\d+)["\']/', $data['body'], $matches);
        $mentionedIds = array_map('intval', array_unique($matches[1]));
        if (count($mentionedIds) > 0) {
            User::whereIn('id', $mentionedIds)
                ->where('id', '!=', $actor->id)
                ->get()
                ->each(fn (User $u) => $u->notify(new MentionedInTicketNotification($ticket, $actor)));
        }

        return $note;
    }

    public function bulkAction(array $ticketIds, string $action, array $data, User $actor): int
    {
        $tickets = Ticket::whereIn('id', $ticketIds)->get();

        foreach ($tickets as $ticket) {
            match ($action) {
                'assign'        => $this->assign($ticket, isset($data['assignee_id']) ? (int) $data['assignee_id'] : null, null),
                'change_status' => $this->changeStatus($ticket, (int) $data['status_id']),
                'close'         => $this->closeTicket($ticket, $actor),
                'delete'        => $this->deleteTicket($ticket),
            };
        }

        return $tickets->count();
    }

    public function addWatcher(Ticket $ticket, int $userId): void
    {
        TicketWatcher::firstOrCreate([
            'ticket_id' => $ticket->id,
            'user_id'   => $userId,
        ]);
    }

    public function removeWatcher(Ticket $ticket, int $userId): void
    {
        TicketWatcher::where('ticket_id', $ticket->id)
            ->where('user_id', $userId)
            ->delete();
    }

    public function addTag(Ticket $ticket, int $tagId): void
    {
        $ticket->tags()->syncWithoutDetaching([$tagId]);
    }

    public function removeTag(Ticket $ticket, int $tagId): void
    {
        $ticket->tags()->detach($tagId);
    }

    public function linkParent(Ticket $ticket, ?int $parentId): Ticket
    {
        return $this->ticketRepository->update($ticket, ['parent_ticket_id' => $parentId]);
    }

    public function addAttachment(Ticket $ticket, UploadedFile $file, int $userId): TicketAttachment
    {
        $path = $file->store("attachments/{$ticket->id}", 'local');

        return TicketAttachment::create([
            'ticket_id'   => $ticket->id,
            'user_id'     => $userId,
            'filename'    => $file->getClientOriginalName(),
            'stored_path' => $path,
            'mime_type'   => $file->getMimeType() ?? 'application/octet-stream',
            'size'        => $file->getSize(),
        ]);
    }

    public function removeAttachment(TicketAttachment $attachment): void
    {
        Storage::disk('local')->delete($attachment->stored_path);
        $attachment->delete();
    }

    public function mergeTickets(Ticket $source, Ticket $target, User $actor): Ticket
    {
        DB::transaction(function () use ($source, $target) {
            TicketReply::where('ticket_id', $source->id)->update(['ticket_id' => $target->id]);
            TicketNote::where('ticket_id', $source->id)->update(['ticket_id' => $target->id]);
            TicketAttachment::where('ticket_id', $source->id)->update(['ticket_id' => $target->id]);

            $existingWatcherUserIds = TicketWatcher::where('ticket_id', $target->id)->pluck('user_id');
            TicketWatcher::where('ticket_id', $source->id)
                ->whereNotIn('user_id', $existingWatcherUserIds)
                ->update(['ticket_id' => $target->id]);
            TicketWatcher::where('ticket_id', $source->id)->delete();

            $closedStatus = TicketStatus::where('is_closed', true)->orderBy('sort_order')->first();
            $this->ticketRepository->update($source, [
                'merged_into_id' => $target->id,
                'closed_at'      => now(),
                'status_id'      => $closedStatus?->id ?? $source->status_id,
            ]);
        });

        return $target->fresh(['status', 'category', 'requester', 'assignee', 'team', 'tags']);
    }
}
