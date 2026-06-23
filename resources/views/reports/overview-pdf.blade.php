<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Reports Overview</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1f2937; line-height: 1.4; }
.page { padding: 28px 32px; }
h1 { font-size: 20px; color: #111827; font-weight: bold; }
.meta { font-size: 10px; color: #6b7280; margin-top: 2px; margin-bottom: 20px; }
h2 { font-size: 12px; font-weight: bold; color: #374151; margin: 18px 0 7px;
     border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
th { background: #f3f4f6; text-align: left; padding: 5px 8px;
     font-size: 9px; font-weight: bold; color: #6b7280; text-transform: uppercase;
     border-bottom: 1px solid #d1d5db; }
td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; font-size: 10px; color: #374151; }
.r  { text-align: right; }
.bold { font-weight: bold; }
.green { color: #16a34a; }
.amber { color: #d97706; }
.red   { color: #dc2626; }
.tag { display: inline-block; padding: 1px 6px; border-radius: 3px;
       font-size: 9px; font-weight: bold; }
.tag-critical { background: #fee2e2; color: #dc2626; }
.tag-high     { background: #ffedd5; color: #ea580c; }
.tag-medium   { background: #fef9c3; color: #ca8a04; }
.tag-low      { background: #dcfce7; color: #16a34a; }
.tfoot-row td { background: #f9fafb; font-weight: bold; border-top: 1px solid #d1d5db; }
.footer { margin-top: 28px; font-size: 9px; color: #9ca3af;
          border-top: 1px solid #e5e7eb; padding-top: 8px; text-align: right; }
</style>
</head>
<body>
<div class="page">

    {{-- Header --}}
    <h1>Reports Overview</h1>
    <p class="meta">Period: {{ $from }} — {{ $to }} &nbsp;·&nbsp; Generated {{ $generated_at }}</p>

    {{-- KPI Summary --}}
    <h2>Key Metrics</h2>
    <table>
        <thead>
            <tr>
                <th>Tickets Created</th>
                <th>Open Tickets</th>
                <th>Avg 1st Response</th>
                <th>Avg Resolution</th>
                <th>SLA Compliance</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="bold" style="font-size:16px;">{{ number_format($kpis['ticket_volume']) }}</td>
                <td class="bold" style="font-size:16px;">{{ number_format($kpis['open_tickets']) }}</td>
                <td class="bold" style="font-size:16px;">
                    {{ $kpis['avg_first_response_minutes'] !== null
                        ? \App\Services\ReportService::formatMinutes((float)$kpis['avg_first_response_minutes'])
                        : '—' }}
                </td>
                <td class="bold" style="font-size:16px;">
                    {{ $kpis['avg_resolution_minutes'] !== null
                        ? \App\Services\ReportService::formatMinutes((float)$kpis['avg_resolution_minutes'])
                        : '—' }}
                </td>
                @php
                    $pct = $kpis['sla_compliance_pct'];
                    $cls = $pct === null ? '' : ($pct >= 90 ? 'green' : ($pct >= 70 ? 'amber' : 'red'));
                @endphp
                <td class="bold {{ $cls }}" style="font-size:16px;">
                    {{ $pct !== null ? $pct.'%' : '—' }}
                </td>
            </tr>
        </tbody>
    </table>

    {{-- Ticket Breakdown --}}
    <h2>Ticket Breakdown</h2>
    @php $maxRows = max(count($by_priority), count($by_status), count($by_category), 1); @endphp
    <table>
        <thead>
            <tr>
                <th style="width:22%">Priority</th>
                <th class="r" style="width:11%">Count</th>
                <th style="width:22%">Status</th>
                <th class="r" style="width:11%">Count</th>
                <th style="width:22%">Category</th>
                <th class="r" style="width:12%">Count</th>
            </tr>
        </thead>
        <tbody>
            @for($i = 0; $i < $maxRows; $i++)
            <tr>
                <td>
                    @if(isset($by_priority[$i]))
                        <span class="tag tag-{{ $by_priority[$i]['priority'] }}">
                            {{ ucfirst($by_priority[$i]['priority']) }}
                        </span>
                    @endif
                </td>
                <td class="r">{{ isset($by_priority[$i]) ? number_format($by_priority[$i]['count']) : '' }}</td>
                <td>{{ $by_status[$i]['status'] ?? '' }}</td>
                <td class="r">{{ isset($by_status[$i]) ? number_format($by_status[$i]['count']) : '' }}</td>
                <td>{{ $by_category[$i]['category'] ?? '' }}</td>
                <td class="r">{{ isset($by_category[$i]) ? number_format($by_category[$i]['count']) : '' }}</td>
            </tr>
            @endfor
        </tbody>
    </table>

    {{-- SLA Compliance --}}
    <h2>SLA Compliance</h2>
    <table>
        <thead>
            <tr>
                <th style="width:70%">Metric</th>
                <th class="r">Count</th>
            </tr>
        </thead>
        <tbody>
            <tr><td>Total SLA Tickets</td><td class="r">{{ number_format($sla_compliance['total']) }}</td></tr>
            <tr>
                <td class="green">Fully Compliant</td>
                <td class="r green">{{ number_format($sla_compliance['compliant']) }}</td>
            </tr>
            <tr>
                <td class="amber">First Response Breached</td>
                <td class="r amber">{{ number_format($sla_compliance['first_response_breached']) }}</td>
            </tr>
            <tr>
                <td class="red">Resolution Breached</td>
                <td class="r red">{{ number_format($sla_compliance['resolution_breached']) }}</td>
            </tr>
        </tbody>
        <tfoot>
            @php
                $cp = $sla_compliance['compliance_pct'];
                $cc = $cp === null ? '' : ($cp >= 90 ? 'green' : ($cp >= 70 ? 'amber' : 'red'));
            @endphp
            <tr class="tfoot-row">
                <td>Compliance Rate</td>
                <td class="r {{ $cc }}">{{ $cp !== null ? $cp.'%' : '—' }}</td>
            </tr>
        </tfoot>
    </table>

    {{-- Agent Performance --}}
    @if(count($agent_performance) > 0)
    <h2>Agent Performance</h2>
    <table>
        <thead>
            <tr>
                <th>Agent</th>
                <th class="r">Handled</th>
                <th class="r">Avg 1st Response</th>
                <th class="r">Avg Resolution</th>
                <th class="r">SLA %</th>
            </tr>
        </thead>
        <tbody>
            @foreach($agent_performance as $row)
            @php
                $sc = $row['sla_compliance_pct'] === null
                    ? ''
                    : ($row['sla_compliance_pct'] >= 90 ? 'green'
                    : ($row['sla_compliance_pct'] >= 70 ? 'amber' : 'red'));
            @endphp
            <tr>
                <td>{{ $row['agent'] }}</td>
                <td class="r">{{ $row['tickets_handled'] }}</td>
                <td class="r">
                    {{ $row['avg_first_response_minutes'] !== null
                        ? \App\Services\ReportService::formatMinutes((float)$row['avg_first_response_minutes'])
                        : '—' }}
                </td>
                <td class="r">
                    {{ $row['avg_resolution_minutes'] !== null
                        ? \App\Services\ReportService::formatMinutes((float)$row['avg_resolution_minutes'])
                        : '—' }}
                </td>
                <td class="r {{ $sc }}">
                    {{ $row['sla_compliance_pct'] !== null ? $row['sla_compliance_pct'].'%' : '—' }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <div class="footer">Enterprise Laravel Ticketing System &nbsp;·&nbsp; {{ $generated_at }}</div>
</div>
</body>
</html>
