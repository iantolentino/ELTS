<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\StoreAttachmentRequest;
use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketAttachmentController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function store(StoreAttachmentRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->ticketService->addAttachment($ticket, $request->file('file'), $request->user()->id);

        return back()->with('success', 'File attached.');
    }

    public function download(Request $request, Ticket $ticket, TicketAttachment $attachment): StreamedResponse
    {
        Gate::authorize('view', $ticket);
        abort_unless($attachment->ticket_id === $ticket->id, 404);

        return Storage::disk('local')->download($attachment->stored_path, $attachment->filename);
    }

    public function destroy(Request $request, Ticket $ticket, TicketAttachment $attachment): RedirectResponse
    {
        Gate::authorize('update', $ticket);
        abort_unless($attachment->ticket_id === $ticket->id, 404);

        $this->ticketService->removeAttachment($attachment);

        return back()->with('success', 'Attachment removed.');
    }
}
