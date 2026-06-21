<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TicketWatcherController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function store(Request $request, Ticket $ticket): RedirectResponse
    {
        Gate::authorize('watch', $ticket);
        $this->ticketService->addWatcher($ticket, $request->user()->id);

        return back();
    }

    public function destroy(Request $request, Ticket $ticket): RedirectResponse
    {
        Gate::authorize('watch', $ticket);
        $this->ticketService->removeWatcher($ticket, $request->user()->id);

        return back();
    }
}
