<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $q       = (string) $request->string('q')->trim();
        $exclude = $request->integer('exclude');

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $tickets = Ticket::query()
            ->with('status:id,name,color')
            ->whereNull('merged_into_id')
            ->when($exclude, fn ($query) => $query->where('id', '!=', $exclude))
            ->where(fn ($query) => $query
                ->where('ticket_number', 'like', "%{$q}%")
                ->orWhere('subject', 'like', "%{$q}%")
            )
            ->limit(10)
            ->get(['id', 'ticket_number', 'subject', 'status_id']);

        return response()->json($tickets->map(fn ($t) => [
            'id'            => $t->id,
            'ticket_number' => $t->ticket_number,
            'subject'       => $t->subject,
            'status'        => ['name' => $t->status->name, 'color' => $t->status->color],
        ]));
    }
}
