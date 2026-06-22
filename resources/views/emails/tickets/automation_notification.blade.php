@extends('emails.layout')

@section('content')
    <h2 style="margin: 0 0 16px; font-size: 20px; color: #1e40af;">Message about your ticket</h2>

    <div class="ticket-box">
        <p><strong>Ticket:</strong> {{ $ticket->ticket_number }} — {{ $ticket->subject }}</p>
        <p><strong>Status:</strong> {{ $ticket->status?->name ?? '—' }}</p>
    </div>

    @if(!empty($extra['automation_message']))
        <p style="margin: 16px 0; color: #374151;">{{ $extra['automation_message'] }}</p>
    @endif

    <p style="margin: 20px 0 0;">
        <a href="{{ config('app.url') }}/tickets/{{ $ticket->id }}"
           style="background:#1e40af;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
            View Ticket
        </a>
    </p>
@endsection
