<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\TicketRepositoryInterface;
use App\Models\Ticket;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentTicketRepository implements TicketRepositoryInterface
{
    private const ALLOWED_SORTS = ['created_at', 'updated_at', 'ticket_number', 'subject', 'priority'];

    public function paginate(array $params): LengthAwarePaginator
    {
        $query = Ticket::query()
            ->with(['status', 'category', 'requester', 'assignee', 'team', 'tags'])
            ->whereNull('merged_into_id');

        if ($search = trim((string) ($params['search'] ?? ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhereHas('requester', fn ($r) => $r->where('name', 'like', "%{$search}%"));
            });
        }

        if ($statusId = ($params['status_id'] ?? null)) {
            $query->where('status_id', (int) $statusId);
        }

        if ($priority = ($params['priority'] ?? null)) {
            $query->where('priority', $priority);
        }

        if ($categoryId = ($params['category_id'] ?? null)) {
            $query->where('category_id', (int) $categoryId);
        }

        if ($assigneeId = ($params['assignee_id'] ?? null)) {
            if ($assigneeId === 'unassigned') {
                $query->whereNull('assignee_id');
            } else {
                $query->where('assignee_id', (int) $assigneeId);
            }
        }

        if ($requesterId = ($params['requester_id'] ?? null)) {
            $query->where('requester_id', (int) $requesterId);
        }

        if ($teamId = ($params['team_id'] ?? null)) {
            $query->where('team_id', (int) $teamId);
        }

        if ($dateFrom = ($params['date_from'] ?? null)) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo = ($params['date_to'] ?? null)) {
            $query->where('created_at', '<=', $dateTo . ' 23:59:59');
        }

        $sortBy  = in_array($params['sort_by'] ?? '', self::ALLOWED_SORTS, true) ? $params['sort_by'] : 'created_at';
        $sortDir = ($params['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        if ($sortBy === 'priority') {
            $query->orderByRaw(
                "FIELD(priority, 'critical', 'high', 'medium', 'low') " . ($sortDir === 'asc' ? 'ASC' : 'DESC')
            );
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = max(1, min(100, (int) ($params['per_page'] ?? config('ticketing.pagination.per_page', 20))));

        return $query->paginate($perPage)->withQueryString();
    }

    public function findOrFail(int $id): Ticket
    {
        return Ticket::with(['status', 'category', 'requester', 'assignee', 'team', 'tags', 'watchers', 'replies.user', 'notes.user', 'attachments', 'customFieldValues.field'])->findOrFail($id);
    }

    public function create(array $data): Ticket
    {
        return Ticket::create($data);
    }

    public function update(Ticket $ticket, array $data): Ticket
    {
        $ticket->update($data);
        return $ticket;
    }

    public function delete(Ticket $ticket): void
    {
        $ticket->delete();
    }
}
