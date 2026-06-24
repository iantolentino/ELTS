@extends('emails.layout')

@section('content')
<p>Hi {{ $survey->user?->name ?? 'there' }},</p>
<p>We're always looking to improve. On a scale of 0–10, <strong>how likely are you to recommend our support to a friend or colleague?</strong></p>

<p style="font-weight:600; margin-bottom:12px; margin-top:24px;">0 = Not at all likely &nbsp;&nbsp; 10 = Extremely likely</p>

<table cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 20px;">
  <tr>
    @for ($score = 0; $score <= 10; $score++)
    <td style="padding: 0 4px 0 0;">
      <a href="{{ url('/nps/' . $survey->token . '?score=' . $score) }}"
         style="display:inline-block; width:40px; text-align:center; padding:10px 0; background:{{ $score <= 6 ? '#fee2e2' : ($score <= 8 ? '#fef9c3' : '#dcfce7') }}; border:1px solid {{ $score <= 6 ? '#fca5a5' : ($score <= 8 ? '#fde047' : '#86efac') }}; border-radius:6px; text-decoration:none; color:#111827; font-size:15px; font-weight:600; line-height:1;">
        {{ $score }}
      </a>
    </td>
    @endfor
  </tr>
</table>

<p style="font-size:13px; color:#6b7280;">
  Or <a href="{{ url('/nps/' . $survey->token) }}" style="color:#2563eb;">open the survey</a> to add a comment with your score.
</p>

<p style="font-size:13px; color:#6b7280; margin-top:24px;">
  This survey expires in {{ config('ticketing.satisfaction.survey_token_expiry_days', 7) }} days.
  If you have questions, just reply to this email.
</p>
@endsection
