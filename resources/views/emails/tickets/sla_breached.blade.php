@extends('emails.layout')

@section('content')
    <h2 style="margin: 0 0 16px; font-size: 20px; color: #dc2626;">⚠ SLA Breach Alert</h2>

    <p style="margin: 0 0 12px; color: #374151;">
        The following ticket has exceeded its <strong>{{ $extra['sla_label'] ?? 'SLA' }}</strong> target
        and requires your immediate attention.
    </p>

    <div class="ticket-box">
        <p><strong>Ticket:</strong> {{ $ticket->ticket_number }} — {{ $ticket->subject }}</p>
        <p><strong>Priority:</strong> {{ ucfirst($ticket->priority) }}</p>
        <p><strong>Status:</strong> {{ $ticket->status?->name ?? '—' }}</p>
        <p><strong>Requester:</strong> {{ $ticket->requester?->name ?? '—' }}</p>
        <p><strong>SLA Type:</strong> {{ $extra['sla_label'] ?? ucfirst(str_replace('_', ' ', $extra['sla_type'] ?? '')) }}</p>
    </div>

    <p style="margin: 20px 0 0;">
        <a href="{{ config('app.url') }}/tickets/{{ $ticket->id }}"
           style="background:#dc2626;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
            View Ticket
        </a>
    </p>
@endsection
