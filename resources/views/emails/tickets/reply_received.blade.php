@extends('emails.layout')

@section('content')
<p>Hi {{ $ticket->requester->name }},</p>
<p>A new reply has been added to your support ticket.</p>

<div class="ticket-box">
  <div class="number">{{ $ticket->ticket_number }}</div>
  <div class="subject">{{ $ticket->subject }}</div>
</div>

@if(!empty($extra['reply_body']))
<p><strong>Reply from {{ $extra['agent_name'] ?? 'Support Team' }}:</strong></p>
<div class="reply-body">{!! $extra['reply_body'] !!}</div>
@endif

<a class="btn" href="{{ config('app.url') }}/tickets/{{ $ticket->id }}">View Full Thread</a>
@endsection
