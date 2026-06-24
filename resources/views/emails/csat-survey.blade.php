@extends('emails.layout')

@section('content')
<p>Hi {{ $ticket->requester->name }},</p>
<p>Your support ticket has been resolved. We'd love to hear how we did!</p>

<div class="ticket-box">
  <div class="number">Ticket #{{ $ticket->ticket_number }}</div>
  <div class="subject">{{ $ticket->subject }}</div>
</div>

<p style="font-weight:600; margin-bottom:8px;">How satisfied were you with the support you received?</p>

<table cellpadding="0" cellspacing="0" border="0" style="margin: 16px 0;">
  <tr>
    @foreach([1 => '😞', 2 => '😕', 3 => '😐', 4 => '🙂', 5 => '😄'] as $score => $emoji)
    <td style="padding: 0 6px 0 0;">
      <a href="{{ url('/csat/' . $survey->token . '?score=' . $score) }}"
         style="display:inline-block; width:52px; text-align:center; padding:10px 0; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; text-decoration:none; color:#374151; font-size:22px; line-height:1;">
        {{ $emoji }}<br>
        <span style="font-size:11px; color:#6b7280;">{{ $score }}</span>
      </a>
    </td>
    @endforeach
  </tr>
</table>

<p style="font-size:13px; color:#6b7280;">
  Or <a href="{{ url('/csat/' . $survey->token) }}" style="color:#2563eb;">leave a detailed rating</a> with a comment.
</p>

<p style="font-size:13px; color:#6b7280; margin-top:24px;">
  This survey expires in {{ config('ticketing.satisfaction.survey_token_expiry_days', 7) }} days.
  If you did not request this, you can safely ignore it.
</p>
@endsection
