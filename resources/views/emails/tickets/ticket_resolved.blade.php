@extends('emails.layout')

@section('content')
<p>Hi {{ $ticket->requester->name }},</p>
<p>Your support ticket has been marked as <strong>Resolved</strong>. We hope your issue has been addressed to your satisfaction.</p>

<div class="ticket-box">
  <div class="number">{{ $ticket->ticket_number }}</div>
  <div class="subject">{{ $ticket->subject }}</div>
  <div class="meta">Resolved on {{ now()->format('M d, Y') }}</div>
</div>

<p>If you have any further questions or the issue has not been fully resolved, you can reply to this email or click the button below to reopen your ticket.</p>
<a class="btn" href="{{ config('app.url') }}/tickets/{{ $ticket->id }}">View Ticket</a>
@endsection
