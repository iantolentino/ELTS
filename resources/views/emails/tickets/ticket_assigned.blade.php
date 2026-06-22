@extends('emails.layout')

@section('content')
<p>Hi {{ $extra['assignee_name'] ?? 'Team Member' }},</p>
<p>A support ticket has been assigned to you and requires your attention.</p>

<div class="ticket-box">
  <div class="number">{{ $ticket->ticket_number }}</div>
  <div class="subject">{{ $ticket->subject }}</div>
  <div class="meta">
    Priority: {{ ucfirst($ticket->priority) }} &nbsp;·&nbsp;
    Requester: {{ $ticket->requester->name }}
    @if($ticket->due_at) &nbsp;·&nbsp; Due: {{ $ticket->due_at->format('M d, Y') }} @endif
  </div>
</div>

<a class="btn" href="{{ config('app.url') }}/tickets/{{ $ticket->id }}">Open Ticket</a>
@endsection
