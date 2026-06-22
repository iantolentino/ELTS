@extends('emails.layout')

@section('content')
<p>Hi {{ $ticket->requester->name }},</p>
<p>Your support ticket has been <strong>closed</strong>. Thank you for contacting us.</p>

<div class="ticket-box">
  <div class="number">{{ $ticket->ticket_number }}</div>
  <div class="subject">{{ $ticket->subject }}</div>
  <div class="meta">Closed on {{ now()->format('M d, Y') }}</div>
</div>

<p>If you need further assistance, please open a new ticket or reply to this email to reopen this one.</p>
<a class="btn" href="{{ config('app.url') }}/tickets/{{ $ticket->id }}">View Ticket</a>
@endsection
