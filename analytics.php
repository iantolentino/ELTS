<?php
declare(strict_types=1);

// T055-T059 — shared analytics module: stat cards, charts, and "recent tickets" used by the
// department dashboard, the superadmin cross-department dashboard, and both Reports sections.
// Every function here takes a caller-supplied $whereSql/$params fragment (already scoped to a
// department, or '1=1' for "all tickets") so isolation is decided once by the caller and this
// file never has to know who's allowed to see what — same shape as department_controller.php's
// own $where convention, so the two compose without drift.
//
// Hand-rolled charts (CSS conic-gradient pie, flex-box bar, inline SVG line) rather than a JS
// charting library — matches the project's no-framework-bloat precedent (decision_log.md [STACK]).

const PRIORITY_LEVELS = ['low', 'med', 'high', 'urgent'];

// One aggregate query rather than eight — status/priority/SLA counts all read the same rows.
// $whereSql must reference bare column names or `tickets.`-qualified ones (never a different
// alias) since this always queries "FROM tickets" unaliased, same assumption department_controller.php
// already relies on for its own $where fragments.
function computeTicketStats(string $whereSql, array $params): array
{
    $row = dbFetchOne(
        "SELECT
            SUM(status = 'open') AS open_count,
            SUM(status = 'in_progress') AS in_progress_count,
            SUM(status = 'closed') AS resolved_count,
            SUM(priority = 'urgent' AND status NOT IN ('closed','cancelled')) AS critical_count,
            SUM(status NOT IN ('closed','cancelled') AND (sla_deadline IS NULL OR sla_deadline > NOW())) AS sla_on_track,
            SUM(status NOT IN ('closed','cancelled') AND sla_deadline IS NOT NULL AND sla_deadline < NOW()) AS sla_breached,
            SUM(status = 'closed' AND (sla_deadline IS NULL OR updated_at <= sla_deadline)) AS sla_completed,
            SUM(status = 'closed' AND sla_deadline IS NOT NULL AND updated_at > sla_deadline) AS sla_breached_closed,
            COUNT(*) AS total
         FROM tickets WHERE $whereSql",
        $params
    );

    return [
        'open' => (int) ($row['open_count'] ?? 0),
        'in_progress' => (int) ($row['in_progress_count'] ?? 0),
        'resolved' => (int) ($row['resolved_count'] ?? 0),
        'critical' => (int) ($row['critical_count'] ?? 0),
        'sla_on_track' => (int) ($row['sla_on_track'] ?? 0),
        'sla_breached' => (int) ($row['sla_breached'] ?? 0),
        'sla_completed' => (int) ($row['sla_completed'] ?? 0),
        'sla_breached_closed' => (int) ($row['sla_breached_closed'] ?? 0),
        'total' => (int) ($row['total'] ?? 0),
    ];
}

function renderStatCardsHtml(array $stats): string
{
    $total = max(1, $stats['total']);
    $slaTotal = max(1, $stats['sla_on_track'] + $stats['sla_breached'] + $stats['sla_completed'] + $stats['sla_breached_closed']);

    $cards = [
        ['label' => 'Resolved', 'value' => $stats['resolved'], 'sub' => round($stats['resolved'] / $total * 100) . '% of all tickets', 'tone' => 'good'],
        ['label' => 'Critical', 'value' => $stats['critical'], 'sub' => 'Urgent priority, still open', 'tone' => $stats['critical'] > 0 ? 'bad' : 'neutral'],
        ['label' => 'SLA On Track', 'value' => $stats['sla_on_track'], 'sub' => round($stats['sla_on_track'] / $slaTotal * 100) . '% of SLA-tracked tickets', 'tone' => 'good'],
        ['label' => 'SLA Breach', 'value' => $stats['sla_breached'], 'sub' => 'Open tickets past deadline', 'tone' => $stats['sla_breached'] > 0 ? 'bad' : 'neutral'],
        ['label' => 'SLA Completed', 'value' => $stats['sla_completed'], 'sub' => 'Closed within SLA', 'tone' => 'good'],
        ['label' => 'Breached & Closed', 'value' => $stats['sla_breached_closed'], 'sub' => 'Closed after SLA breach', 'tone' => $stats['sla_breached_closed'] > 0 ? 'bad' : 'neutral'],
    ];

    $html = '<div class="stat-card-grid">';
    foreach ($cards as $c) {
        $html .= '<div class="card stat-card stat-card-' . $c['tone'] . '">'
            . '<div class="stat-card-label">' . htmlspecialchars($c['label']) . '</div>'
            . '<div class="stat-card-value">' . (int) $c['value'] . '</div>'
            . '<div class="stat-card-sub muted">' . htmlspecialchars((string) $c['sub']) . '</div>'
            . '</div>';
    }
    return $html . '</div>';
}

function fetchStatusBreakdown(string $whereSql, array $params): array
{
    $rows = dbFetchAll("SELECT status, COUNT(*) AS cnt FROM tickets WHERE $whereSql GROUP BY status", $params);
    $counts = array_fill_keys(VALID_TICKET_STATUSES, 0);
    foreach ($rows as $row) {
        $counts[(string) $row['status']] = (int) $row['cnt'];
    }
    return $counts;
}

function fetchPriorityBreakdown(string $whereSql, array $params): array
{
    $rows = dbFetchAll("SELECT priority, COUNT(*) AS cnt FROM tickets WHERE $whereSql GROUP BY priority", $params);
    $counts = array_fill_keys(PRIORITY_LEVELS, 0);
    foreach ($rows as $row) {
        $counts[(string) $row['priority']] = (int) $row['cnt'];
    }
    return $counts;
}

// Reads range/range_from/range_to from $_GET — namespaced away from 'from'/'to' (used by the
// admin Reports date-range filter on the same query string in some views) and 'status'/'page'
// (used by the department dashboard filter) so the two controls never collide.
function resolveChartRangeFromRequest(): array
{
    $range = (string) ($_GET['range'] ?? '7d');
    if (!in_array($range, ['7d', '30d', '3m', '6m', 'custom'], true)) {
        $range = '7d';
    }

    $customFrom = (string) ($_GET['range_from'] ?? '');
    $customTo = (string) ($_GET['range_to'] ?? '');
    $validCustom = $range === 'custom'
        && preg_match('/^\d{4}-\d{2}-\d{2}$/', $customFrom)
        && preg_match('/^\d{4}-\d{2}-\d{2}$/', $customTo)
        && $customFrom <= $customTo;

    // 'custom' with no (or not-yet-valid) dates is a real, renderable state — it's what "the user
    // just clicked Custom and hasn't picked dates yet" looks like. The date-picker form below still
    // needs *some* prefilled values, so this defaults to the last 7 days rather than leaving the
    // inputs blank; the chart itself also falls back to that same 7-day window (see
    // fetchTicketsCreatedSeries) until real dates are submitted.
    $from = $validCustom ? $customFrom : date('Y-m-d', strtotime('-6 days'));
    $to = $validCustom ? $customTo : date('Y-m-d');

    return ['range' => $range, 'from' => $from, 'to' => $to];
}

// Days spanned by a resolved range, used both to size the query window and to decide day vs.
// month bucketing below.
function chartRangeDays(array $resolved): int
{
    return match ($resolved['range']) {
        '7d' => 7,
        '30d' => 30,
        '3m' => 90,
        '6m' => 180,
        'custom' => max(1, (int) ((strtotime((string) $resolved['to']) - strtotime((string) $resolved['from'])) / 86400) + 1),
        default => 7,
    };
}

// One GROUP BY query, gaps filled in PHP — cheaper than one query per bucket. Buckets by day for
// ranges up to 31 days, by month beyond that (mirrors Trackr's own >30-day monthly grouping),
// so a 6-month chart renders ~6 bars instead of ~180.
function fetchTicketsCreatedSeries(string $whereSql, array $params, array $resolved): array
{
    $days = chartRangeDays($resolved);
    $byDay = $days <= 31;

    if ($resolved['range'] === 'custom') {
        $rangeStart = (string) $resolved['from'] . ' 00:00:00';
        $rangeEndExclusive = date('Y-m-d 00:00:00', strtotime((string) $resolved['to'] . ' +1 day'));
    } else {
        $rangeStart = date('Y-m-d 00:00:00', strtotime('-' . ($days - 1) . ' days'));
        $rangeEndExclusive = date('Y-m-d 00:00:00', strtotime('+1 day'));
    }

    $bucketExpr = $byDay ? 'DATE(created_at)' : "DATE_FORMAT(created_at, '%Y-%m')";
    $rows = dbFetchAll(
        "SELECT $bucketExpr AS bucket, COUNT(*) AS cnt FROM tickets
         WHERE $whereSql AND created_at >= :range_start AND created_at < :range_end
         GROUP BY bucket",
        $params + ['range_start' => $rangeStart, 'range_end' => $rangeEndExclusive]
    );
    $countsByBucket = [];
    foreach ($rows as $row) {
        $countsByBucket[(string) $row['bucket']] = (int) $row['cnt'];
    }

    $points = [];
    if ($byDay) {
        $cursor = strtotime($rangeStart);
        $end = strtotime($rangeEndExclusive);
        while ($cursor < $end) {
            $key = date('Y-m-d', $cursor);
            $points[] = ['label' => date($days > 14 ? 'M j' : 'D j', $cursor), 'count' => $countsByBucket[$key] ?? 0];
            $cursor = strtotime('+1 day', $cursor);
        }
    } else {
        $months = (int) ceil($days / 30);
        $cursor = strtotime(date('Y-m-01', strtotime($rangeStart)));
        for ($i = 0; $i < $months; $i++) {
            $key = date('Y-m', $cursor);
            $points[] = ['label' => date('M \'y', $cursor), 'count' => $countsByBucket[$key] ?? 0];
            $cursor = strtotime('+1 month', $cursor);
        }
    }

    return $points;
}

/**
 * @param array<int,array<string,mixed>> $points
 */
function renderTicketsCreatedChart(string $baseUrl, array $extraQuery, array $resolved, array $points): string
{
    $rangeLabels = ['7d' => '7D', '30d' => '30D', '3m' => '3M', '6m' => '6M', 'custom' => 'Custom'];
    $toggle = '<div class="chart-range-toggle">';
    foreach ($rangeLabels as $key => $label) {
        $qs = http_build_query($extraQuery + ['range' => $key]);
        $active = $resolved['range'] === $key ? ' active' : '';
        $toggle .= '<a class="chart-range-btn' . $active . '" href="' . htmlspecialchars($baseUrl . '?' . $qs) . '">' . $label . '</a>';
    }
    $toggle .= '</div>';

    $customForm = '<form method="get" action="' . htmlspecialchars($baseUrl) . '" class="chart-range-custom">';
    foreach ($extraQuery as $k => $v) {
        if ($k === 'range') {
            continue;
        }
        $customForm .= '<input type="hidden" name="' . htmlspecialchars((string) $k) . '" value="' . htmlspecialchars((string) $v) . '">';
    }
    $customForm .= '<input type="hidden" name="range" value="custom">'
        . '<input type="date" name="range_from" value="' . htmlspecialchars((string) ($resolved['from'] ?? '')) . '" required>'
        . '<span class="muted">to</span>'
        . '<input type="date" name="range_to" value="' . htmlspecialchars((string) ($resolved['to'] ?? '')) . '" required>'
        . '<button class="btn btn-outline" type="submit" style="padding:.3rem .7rem; font-size:.8rem;">Apply</button>'
        . '</form>';

    $max = 1;
    foreach ($points as $p) {
        $max = max($max, (int) $p['count']);
    }

    $n = count($points);
    $width = 600;
    $height = 160;
    $svgPoints = [];
    foreach ($points as $i => $p) {
        $x = $n <= 1 ? $width / 2 : ($i / ($n - 1)) * $width;
        $y = $height - (((int) $p['count'] / $max) * ($height - 10)) - 5;
        $svgPoints[] = round($x, 1) . ',' . round($y, 1);
    }
    $polyline = implode(' ', $svgPoints);

    // Labels below the axis — every point for <= 10 buckets, otherwise thinned to avoid overlap.
    $labelStep = $n > 10 ? (int) ceil($n / 10) : 1;
    $labelsHtml = '<div class="chart-line-labels">';
    foreach ($points as $i => $p) {
        if ($i % $labelStep !== 0 && $i !== $n - 1) {
            continue;
        }
        $labelsHtml .= '<span>' . htmlspecialchars((string) $p['label']) . '</span>';
    }
    $labelsHtml .= '</div>';

    return '
    <div class="chart-header">
      <div>
        <h3 class="chart-title">Tickets Created</h3>
        <p class="muted chart-subtitle">' . (int) array_sum(array_column($points, 'count')) . ' ticket(s) in range</p>
      </div>
      ' . $toggle . '
    </div>'
        . ($resolved['range'] === 'custom' ? $customForm : '')
        . '<svg viewBox="0 0 ' . $width . ' ' . $height . '" class="chart-line-svg" preserveAspectRatio="none">
        <polyline points="' . htmlspecialchars($polyline) . '" fill="none" stroke="var(--foreground)" stroke-width="2" vector-effect="non-scaling-stroke"></polyline>
      </svg>'
        . $labelsHtml;
}

const STATUS_CHART_COLORS = [
    'open' => 'var(--chart-1)',
    'in_progress' => 'var(--chart-4)',
    'on-hold' => 'var(--chart-3)',
    'closed' => 'var(--chart-2)',
    'cancelled' => 'var(--muted-foreground)',
];

const PRIORITY_CHART_COLORS = [
    'low' => 'var(--chart-2)',
    'med' => 'var(--chart-3)',
    'high' => 'var(--chart-4)',
    'urgent' => 'var(--destructive)',
];

function renderStatusPieChart(array $statusCounts): string
{
    $total = array_sum($statusCounts);
    if ($total === 0) {
        return '<p class="muted">No tickets yet.</p>';
    }

    $segments = [];
    $legend = '';
    $cursor = 0.0;
    foreach ($statusCounts as $status => $count) {
        if ($count === 0) {
            continue;
        }
        $color = STATUS_CHART_COLORS[$status] ?? 'var(--muted-foreground)';
        $slice = $count / $total * 360;
        $segments[] = $color . ' ' . round($cursor, 2) . 'deg ' . round($cursor + $slice, 2) . 'deg';
        $cursor += $slice;
        $legend .= '<div class="pie-legend-row">'
            . '<span class="pie-legend-dot" style="background:' . $color . ';"></span>'
            . '<span class="muted">' . htmlspecialchars(str_replace('_', ' ', $status)) . '</span>'
            . '<span class="pie-legend-count">' . $count . '</span>'
            . '</div>';
    }

    $gradient = implode(', ', $segments);
    return '<div class="pie-chart-wrap">'
        . '<div class="pie-chart" style="background: conic-gradient(' . $gradient . ');"><div class="pie-chart-hole"><span>' . $total . '</span><span class="muted" style="font-size:.7rem;">tickets</span></div></div>'
        . '<div class="pie-legend">' . $legend . '</div>'
        . '</div>';
}

function renderPriorityBarChart(array $priorityCounts): string
{
    $max = max(1, ...array_values($priorityCounts));
    $bars = '';
    foreach ($priorityCounts as $priority => $count) {
        $color = PRIORITY_CHART_COLORS[$priority] ?? 'var(--muted-foreground)';
        $heightPct = max(4, (int) round($count / $max * 100));
        $bars .= '<div class="bar-chart-col">'
            . '<div class="bar-chart-count">' . $count . '</div>'
            . '<div class="bar-chart-bar" style="height:' . $heightPct . '%; background:' . $color . ';"></div>'
            . '<div class="bar-chart-label muted">' . htmlspecialchars(ucfirst($priority)) . '</div>'
            . '</div>';
    }
    return '<div class="bar-chart">' . $bars . '</div>';
}

// $ticketUrlFn maps a ticket row to its detail URL — differs by caller (department-scoped vs.
// cross-department superadmin view), so it's injected rather than assumed here.
function fetchRecentTickets(string $whereSql, array $params, int $limit = 8): array
{
    $limit = max(1, min(50, $limit)); // LIMIT can't be bound as a named param under EMULATE_PREPARES=false; $limit is always an int, never raw request input
    return dbFetchAll(
        "SELECT tickets.id, subject, status, priority, tickets.department_id, tickets.created_at, u.name AS assigned_name, d.name AS dept_name, d.slug AS dept_slug,
                (sla_deadline IS NOT NULL AND sla_deadline < NOW() AND status NOT IN ('closed','cancelled')) AS is_overdue_live
         FROM tickets
         LEFT JOIN users u ON u.id = tickets.assigned_to
         LEFT JOIN departments d ON d.id = tickets.department_id
         WHERE $whereSql ORDER BY tickets.created_at DESC LIMIT $limit",
        $params
    );
}

/**
 * @param array<int,array<string,mixed>> $tickets
 */
function renderRecentTicketsList(array $tickets, callable $ticketUrlFn, bool $showDept = false): string
{
    if ($tickets === []) {
        return '<p class="muted">No recent tickets.</p>';
    }

    $rows = '';
    foreach ($tickets as $t) {
        $badgeClass = 'badge-' . str_replace('_', '-', (string) $t['status']);
        $overdueTag = ((int) $t['is_overdue_live'] === 1) ? ' <span class="badge badge-on-hold">overdue</span>' : '';
        $deptTag = $showDept ? '<span class="muted" style="font-size:.75rem;">' . htmlspecialchars((string) ($t['dept_name'] ?? '—')) . ' · </span>' : '';
        $rows .= '<div class="recent-ticket-row">'
            . '<div class="recent-ticket-main">'
            . '<a href="' . htmlspecialchars($ticketUrlFn($t)) . '">#' . (int) $t['id'] . ' — ' . htmlspecialchars((string) $t['subject']) . '</a>' . $overdueTag
            . '<div class="muted" style="font-size:.78rem; margin-top:.15rem;">' . $deptTag . htmlspecialchars((string) ($t['assigned_name'] ?? 'Unassigned')) . '</div>'
            . '</div>'
            . '<span class="badge ' . htmlspecialchars($badgeClass) . '">' . htmlspecialchars((string) $t['status']) . '</span>'
            . '</div>';
    }
    return '<div class="recent-ticket-list">' . $rows . '</div>';
}

function renderDashboardDateSubtitle(): string
{
    return '<p class="muted dashboard-date-subtitle">' . htmlspecialchars(date('l, F j, Y')) . '</p>';
}
