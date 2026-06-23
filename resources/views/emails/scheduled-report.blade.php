@extends('emails.layout')

@section('content')
<p>Hi,</p>

<p>Please find your scheduled <strong>{{ $report->name }}</strong> report attached.</p>

<div class="ticket-box">
    <div class="number">Report Details</div>
    <div class="subject" style="font-size:14px; margin-top:8px;">{{ $report->name }}</div>
    <div class="meta">
        Period: {{ $from->toFormattedDateString() }} — {{ $to->toFormattedDateString() }}<br>
        Type: {{ ucfirst($report->type) }} &nbsp;·&nbsp; Format: {{ strtoupper($report->format) }}<br>
        Schedule: {{ ucfirst($report->schedule) }}
    </div>
</div>

<p>This report was automatically generated and sent by {{ config('app.name') }}.</p>
@endsection
