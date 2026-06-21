<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\CreateNoteRequest;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;

class TicketNoteController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function store(CreateNoteRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->ticketService->addNote($ticket, $request->validated(), $request->user());

        return back()->with('success', 'Note added.');
    }
}
