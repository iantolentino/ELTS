<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\CannedResponse;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CannedResponseSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user      = Auth::user();
        $query     = $request->string('q')->toString();
        $ticketId  = $request->integer('ticket_id') ?: null;

        $ticket = $ticketId ? Ticket::with(['requester', 'assignee'])->find($ticketId) : null;

        $results = CannedResponse::visibleTo($user)
            ->when($query !== '', fn ($q) =>
                $q->where(fn ($q2) =>
                    $q2->where('title', 'like', "%{$query}%")
                        ->orWhere('body', 'like', "%{$query}%")
                )
            )
            ->orderBy('scope')
            ->orderBy('title')
            ->limit(20)
            ->get(['id', 'title', 'body', 'scope'])
            ->map(fn (CannedResponse $cr) => [
                'id'    => $cr->id,
                'title' => $cr->title,
                'scope' => $cr->scope,
                'body'  => $ticket
                    ? $this->interpolate($cr->body, $ticket, $user)
                    : $cr->body,
            ]);

        return response()->json($results);
    }

    private function interpolate(string $body, Ticket $ticket, $user): string
    {
        return str_replace(
            ['{{client_name}}', '{{ticket_id}}', '{{ticket_number}}', '{{agent_name}}'],
            [
                $ticket->requester?->name ?? '',
                (string) $ticket->id,
                $ticket->ticket_number,
                $user->name,
            ],
            $body,
        );
    }
}
