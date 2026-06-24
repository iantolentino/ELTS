<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9px;
            color: #1a1a2e;
            background: #fff;
        }
        .header {
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }
        .header h1 {
            font-size: 16px;
            font-weight: 700;
            color: #1e3a8a;
        }
        .meta {
            font-size: 8px;
            color: #6b7280;
            margin-top: 3px;
        }
        .filters-bar {
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
            border-radius: 4px;
            padding: 5px 8px;
            margin-bottom: 10px;
            font-size: 8px;
            color: #1e40af;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        thead tr {
            background: #1e3a8a;
            color: #fff;
        }
        thead th {
            padding: 5px 6px;
            text-align: left;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            white-space: nowrap;
        }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr:nth-child(odd)  { background: #ffffff; }
        tbody td {
            padding: 4px 6px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
        }
        .badge {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 7px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-created  { background: #d1fae5; color: #065f46; }
        .badge-updated  { background: #dbeafe; color: #1e40af; }
        .badge-deleted  { background: #fee2e2; color: #991b1b; }
        .badge-default  { background: #f3f4f6; color: #374151; }
        .model-badge {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 7px;
            background: #e0e7ff;
            color: #3730a3;
        }
        .truncation-notice {
            margin-top: 10px;
            padding: 6px 8px;
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 4px;
            font-size: 8px;
            color: #92400e;
        }
        .footer {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #e5e7eb;
            font-size: 7px;
            color: #9ca3af;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>Audit Log Export</h1>
        <p class="meta">Generated: {{ $generated_at }} &nbsp;·&nbsp; {{ $total }} {{ $truncated ? 'of 500+ (truncated)' : 'entries' }}</p>
    </div>

    @php
        $activeFilters = array_filter($filters, fn($v) => $v !== null && $v !== '');
    @endphp

    @if (!empty($activeFilters))
    <div class="filters-bar">
        <strong>Filters applied:</strong>
        @foreach ($activeFilters as $key => $value)
            <span>{{ ucwords(str_replace('_', ' ', $key)) }}: <strong>{{ $value }}</strong></span>
            @if (!$loop->last) &nbsp;|&nbsp; @endif
        @endforeach
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th style="width:13%">Time</th>
                <th style="width:12%">User</th>
                <th style="width:8%">Event</th>
                <th style="width:10%">Model</th>
                <th style="width:7%">Subject</th>
                <th>Description</th>
                <th style="width:8%; text-align:center">Changes</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($activities as $a)
            <tr>
                <td>{{ $a['created_at'] }}</td>
                <td>{{ $a['causer'] }}</td>
                <td>
                    @if ($a['event'])
                        <span class="badge badge-{{ $a['event'] ?? 'default' }}">{{ $a['event'] }}</span>
                    @endif
                </td>
                <td>
                    @if ($a['subject_type'])
                        <span class="model-badge">{{ $a['subject_type'] }}</span>
                    @endif
                </td>
                <td>{{ $a['subject_id'] ? '#' . $a['subject_id'] : '—' }}</td>
                <td>{{ $a['description'] }}</td>
                <td style="text-align:center">
                    @if ($a['changes_count'] > 0)
                        {{ $a['changes_count'] }} field{{ $a['changes_count'] > 1 ? 's' : '' }}
                    @else
                        —
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if ($truncated)
    <div class="truncation-notice">
        ⚠ This PDF is limited to 500 entries. Use CSV export for the complete dataset.
    </div>
    @endif

    <div class="footer">
        Enterprise Laravel Ticketing System &nbsp;·&nbsp; Audit Log &nbsp;·&nbsp; {{ $generated_at }}
    </div>

</body>
</html>
