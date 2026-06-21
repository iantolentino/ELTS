<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\MergeTicketRequest;
use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;

class TicketMergeController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function store(MergeTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        $target = Ticket::findOrFail($request->integer('target_ticket_id'));

        /** @var User $actor */
        $actor = $request->user();

        $this->ticketService->mergeTickets($ticket, $target, $actor);

        return redirect()->route('tickets.show', $target)
            ->with('success', "Ticket {$ticket->ticket_number} merged into {$target->ticket_number}.");
    }
}
