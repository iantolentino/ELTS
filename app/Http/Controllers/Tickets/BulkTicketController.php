<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\BulkActionRequest;
use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class BulkTicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function store(BulkActionRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $action    = $validated['action'];

        match ($action) {
            'assign'        => Gate::authorize('assign', Ticket::class),
            'change_status' => Gate::authorize('changeStatus', Ticket::class),
            'close'         => Gate::authorize('changeStatus', Ticket::class),
            'delete'        => abort_unless($request->user()?->hasPermissionTo('tickets.delete'), 403),
        };

        /** @var User $actor */
        $actor = $request->user();
        $count = $this->ticketService->bulkAction($validated['ticket_ids'], $action, $validated, $actor);

        $label = match ($action) {
            'assign'        => 'assigned',
            'change_status' => 'updated',
            'close'         => 'closed',
            'delete'        => 'deleted',
        };

        return back()->with('success', "{$count} " . str('ticket')->plural($count) . " {$label}.");
    }
}
