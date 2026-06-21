<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\CreateReplyRequest;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;

class TicketReplyController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function store(CreateReplyRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->ticketService->addReply($ticket, $request->validated(), $request->user());

        return back()->with('success', 'Reply sent.');
    }
}
