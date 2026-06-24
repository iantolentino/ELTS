<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Ticket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TicketAssetController extends Controller
{
    /** POST /tickets/{ticket}/assets/{asset} */
    public function store(Request $request, Ticket $ticket, Asset $asset): RedirectResponse
    {
        Gate::authorize('update', $ticket);
        Gate::authorize('view', $asset);

        $ticket->assets()->syncWithoutDetaching([$asset->id]);

        return back()->with('success', 'Asset linked to ticket.');
    }

    /** DELETE /tickets/{ticket}/assets/{asset} */
    public function destroy(Request $request, Ticket $ticket, Asset $asset): RedirectResponse
    {
        Gate::authorize('update', $ticket);

        $ticket->assets()->detach($asset->id);

        return back()->with('success', 'Asset unlinked from ticket.');
    }
}
