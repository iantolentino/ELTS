@extends('emails.layout')

@section('content')
<p>Hi {{ $ticket->requester->name }},</p>
<p>Your support ticket has been received. We will get back to you as soon as possible.</p>

<div class="ticket-box">
  <div class="number">{{ $ticket->ticket_number }}</div>
  <div class="subject">{{ $ticket->subject }}</div>
  <div class="meta">
    Priority: {{ ucfirst($ticket->priority) }} &nbsp;·&nbsp;
    Status: {{ $ticket->status->name }}
    @if($ticket->category) &nbsp;·&nbsp; Category: {{ $ticket->category->name }} @endif
  </div>
</div>

<p>You can track the status of your ticket at any time by clicking the button below.</p>
<a class="btn" href="{{ config('app.url') }}/tickets/{{ $ticket->id }}">View Ticket</a>
@endsection
