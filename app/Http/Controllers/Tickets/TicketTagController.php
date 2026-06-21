<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\AddTagRequest;
use App\Models\Ticket;
use App\Models\TicketTag;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class TicketTagController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function store(AddTagRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->ticketService->addTag($ticket, $request->integer('tag_id'));

        return back();
    }

    public function destroy(Ticket $ticket, TicketTag $tag): RedirectResponse
    {
        Gate::authorize('update', $ticket);
        $this->ticketService->removeTag($ticket, $tag->id);

        return back();
    }
}
