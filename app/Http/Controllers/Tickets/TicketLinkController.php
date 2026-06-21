<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\LinkParentRequest;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TicketLinkController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function store(LinkParentRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->ticketService->linkParent($ticket, $request->integer('parent_ticket_id'));

        return back()->with('success', 'Parent ticket linked.');
    }

    public function destroy(Request $request, Ticket $ticket): RedirectResponse
    {
        Gate::authorize('update', $ticket);
        $this->ticketService->linkParent($ticket, null);

        return back()->with('success', 'Parent ticket removed.');
    }
}
