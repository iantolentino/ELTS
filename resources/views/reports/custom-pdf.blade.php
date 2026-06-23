<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Custom Report</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1f2937; line-height: 1.4; }
.page { padding: 28px 32px; }
h1 { font-size: 20px; color: #111827; font-weight: bold; }
.meta { font-size: 10px; color: #6b7280; margin-top: 2px; margin-bottom: 6px; }
.filters-row { font-size: 10px; color: #374151; margin-bottom: 20px; }
.filter-chip { display: inline-block; background: #ede9fe; color: #6d28d9;
               padding: 1px 7px; border-radius: 4px; margin-right: 4px; font-size: 9px; }
table { width: 100%; border-collapse: collapse; }
th { background: #f3f4f6; text-align: left; padding: 6px 10px;
     font-size: 9px; font-weight: bold; color: #6b7280; text-transform: uppercase;
     border-bottom: 1px solid #d1d5db; }
td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; color: #374151; }
.r  { text-align: right; }
.capitalize { text-transform: capitalize; }
.tfoot-row td { background: #f9fafb; font-weight: bold;
                border-top: 2px solid #d1d5db; border-bottom: none; }
.empty { text-align: center; padding: 48px; color: #9ca3af; font-size: 12px; }
.footer { margin-top: 28px; font-size: 9px; color: #9ca3af;
          border-top: 1px solid #e5e7eb; padding-top: 8px; text-align: right; }
</style>
</head>
<body>
<div class="page">

    {{-- Header --}}
    <h1>Custom Report</h1>
    <p class="meta">
        Metric: <strong>{{ $metric_label }}</strong>
        &nbsp;·&nbsp;
        Grouped by: <strong>{{ $group_label }}</strong>
        &nbsp;·&nbsp;
        Period: {{ $from }} — {{ $to }}
        &nbsp;·&nbsp;
        Generated {{ $generated_at }}
    </p>

    @if(count($filters_applied) > 0)
    <div class="filters-row">
        Filters applied:
        @foreach($filters_applied as $filter)
            <span class="filter-chip">{{ $filter }}</span>
        @endforeach
    </div>
    @endif

    @if(count($results) === 0)
        <p class="empty">No data for the selected parameters.</p>
    @else
        @php $total = array_sum(array_column($results, 'count')); @endphp

        <table>
            <thead>
                <tr>
                    <th>{{ $group_label }}</th>
                    <th class="r">Tickets</th>
                    <th class="r">% of Total</th>
                    <th class="r">Avg Resolution</th>
                </tr>
            </thead>
            <tbody>
                @foreach($results as $row)
                <tr>
                    <td class="capitalize">{{ $row['label'] }}</td>
                    <td class="r">{{ number_format($row['count']) }}</td>
                    <td class="r">
                        {{ $total > 0 ? round(($row['count'] / $total) * 100, 1) : 0 }}%
                    </td>
                    <td class="r">
                        {{ $row['avg_resolution_minutes'] !== null
                            ? \App\Services\ReportService::formatMinutes((float)$row['avg_resolution_minutes'])
                            : '—' }}
                    </td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="tfoot-row">
                    <td>Total</td>
                    <td class="r">{{ number_format($total) }}</td>
                    <td class="r">100%</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>
    @endif

    <div class="footer">Enterprise Laravel Ticketing System &nbsp;·&nbsp; {{ $generated_at }}</div>
</div>
</body>
</html>
