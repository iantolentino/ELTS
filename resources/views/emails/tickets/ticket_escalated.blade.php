@extends('emails.layout')

@section('content')
    <h2 style="margin: 0 0 16px; font-size: 20px; color: #dc2626;">🚨 Ticket Escalated</h2>

    <p style="margin: 0 0 12px; color: #374151;">
        The following ticket has been escalated and set to <strong>Critical</strong> priority.
    </p>

    <div class="ticket-box">
        <p><strong>Ticket:</strong> {{ $ticket->ticket_number }} — {{ $ticket->subject }}</p>
        <p><strong>Priority:</strong> Critical</p>
        <p><strong>Status:</strong> {{ $ticket->status?->name ?? '—' }}</p>
        <p><strong>Requester:</strong> {{ $ticket->requester?->name ?? '—' }}</p>
        <p><strong>Assignee:</strong> {{ $ticket->assignee?->name ?? 'Unassigned' }}</p>
    </div>

    <p style="margin: 20px 0 0;">
        <a href="{{ config('app.url') }}/tickets/{{ $ticket->id }}"
           style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
            View Ticket
        </a>
    </p>
@endsection
