<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Services\SLAService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class TicketSlaController extends Controller
{
    public function __construct(private readonly SLAService $slaService) {}

    public function pause(Ticket $ticket): RedirectResponse
    {
        Gate::authorize('update', $ticket);

        $this->slaService->pause($ticket->load('slaRecord'));

        return back()->with('success', 'SLA clock paused.');
    }

    public function resume(Ticket $ticket): RedirectResponse
    {
        Gate::authorize('update', $ticket);

        $this->slaService->resume($ticket->load('slaRecord'));

        return back()->with('success', 'SLA clock resumed.');
    }
}
