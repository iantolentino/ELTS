<?php

declare(strict_types=1);

namespace App\Services;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /* ── KPI Summary ─────────────────────────────────────────────────────── */

    /**
     * Top-level KPI card metrics for the given date range.
     *
     * @return array{
     *   ticket_volume: int,
     *   open_tickets: int,
     *   avg_first_response_minutes: float|null,
     *   avg_resolution_minutes: float|null,
     *   sla_compliance_pct: float|null,
     * }
     */
    public function kpiSummary(Carbon $from, Carbon $to): array
    {
        $volume = DB::table('tickets')
            ->whereNull('deleted_at')
            ->whereNull('merged_into_id')
            ->whereBetween('created_at', [$from, $to])
            ->count();

        $open = DB::table('tickets')
            ->join('ticket_statuses', 'tickets.status_id', '=', 'ticket_statuses.id')
            ->whereNull('tickets.deleted_at')
            ->whereNull('tickets.merged_into_id')
            ->where('ticket_statuses.is_closed', false)
            ->count();

        $avgFirstResponse = DB::table('tickets')
            ->whereNull('deleted_at')
            ->whereNull('merged_into_id')
            ->whereBetween('created_at', [$from, $to])
            ->whereNotNull('first_response_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, first_response_at)) as avg_min')
            ->value('avg_min');

        $avgResolution = DB::table('tickets')
            ->whereNull('deleted_at')
            ->whereNull('merged_into_id')
            ->whereBetween('closed_at', [$from, $to])
            ->whereNotNull('closed_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, closed_at)) as avg_min')
            ->value('avg_min');

        $slaCompliance = $this->slaCompliancePct($from, $to);

        return [
            'ticket_volume'               => $volume,
            'open_tickets'                => $open,
            'avg_first_response_minutes'  => $avgFirstResponse !== null ? round((float) $avgFirstResponse, 1) : null,
            'avg_resolution_minutes'      => $avgResolution !== null ? round((float) $avgResolution, 1) : null,
            'sla_compliance_pct'          => $slaCompliance,
        ];
    }

    /* ── Volume Trend ────────────────────────────────────────────────────── */

    /**
     * Ticket volume over time, grouped by 'day', 'week', or 'month'.
     *
     * @return array<int, array{label: string, count: int}>
     */
    public function ticketVolumeTrend(Carbon $from, Carbon $to, string $groupBy = 'day'): array
    {
        $format = match ($groupBy) {
            'week'  => '%Y-%u',
            'month' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        $rows = DB::table('tickets')
            ->whereNull('deleted_at')
            ->whereNull('merged_into_id')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw("DATE_FORMAT(created_at, '{$format}') as period, COUNT(*) as cnt")
            ->groupBy('period')
            ->orderBy('period')
            ->pluck('cnt', 'period');

        // Fill in zero-count periods so charts have no gaps
        $filled = [];
        $period = CarbonPeriod::create(
            $from->copy()->startOf($groupBy === 'week' ? 'week' : ($groupBy === 'month' ? 'month' : 'day')),
            "1 {$groupBy}",
            $to,
        );

        foreach ($period as $date) {
            $key = $date->format(match ($groupBy) {
                'week'  => 'Y-W',
                'month' => 'Y-m',
                default => 'Y-m-d',
            });
            $filled[] = [
                'label' => $date->format(match ($groupBy) {
                    'week'  => 'W/Y',
                    'month' => 'M Y',
                    default => 'M j',
                }),
                'count' => (int) ($rows[$key] ?? 0),
            ];
        }

        return $filled;
    }

    /* ── First Response Time ─────────────────────────────────────────────── */

    /**
     * Average first response time per agent (minutes).
     *
     * @return array<int, array{agent: string, avg_minutes: float}>
     */
    public function firstResponseByAgent(Carbon $from, Carbon $to): array
    {
        return DB::table('tickets')
            ->join('users', 'tickets.assignee_id', '=', 'users.id')
            ->whereNull('tickets.deleted_at')
            ->whereNull('tickets.merged_into_id')
            ->whereBetween('tickets.created_at', [$from, $to])
            ->whereNotNull('tickets.first_response_at')
            ->whereNotNull('tickets.assignee_id')
            ->selectRaw('users.name as agent, AVG(TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.first_response_at)) as avg_min, COUNT(*) as cnt')
            ->groupBy('users.id', 'users.name')
            ->orderBy('avg_min')
            ->get()
            ->map(fn ($r) => [
                'agent'       => $r->agent,
                'avg_minutes' => round((float) $r->avg_min, 1),
                'count'       => (int) $r->cnt,
            ])
            ->all();
    }

    /**
     * Average first response time per team (minutes).
     *
     * @return array<int, array{team: string, avg_minutes: float}>
     */
    public function firstResponseByTeam(Carbon $from, Carbon $to): array
    {
        return DB::table('tickets')
            ->join('teams', 'tickets.team_id', '=', 'teams.id')
            ->whereNull('tickets.deleted_at')
            ->whereNull('tickets.merged_into_id')
            ->whereBetween('tickets.created_at', [$from, $to])
            ->whereNotNull('tickets.first_response_at')
            ->whereNotNull('tickets.team_id')
            ->selectRaw('teams.name as team, AVG(TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.first_response_at)) as avg_min, COUNT(*) as cnt')
            ->groupBy('teams.id', 'teams.name')
            ->orderBy('avg_min')
            ->get()
            ->map(fn ($r) => [
                'team'        => $r->team,
                'avg_minutes' => round((float) $r->avg_min, 1),
                'count'       => (int) $r->cnt,
            ])
            ->all();
    }

    /* ── SLA Compliance ──────────────────────────────────────────────────── */

    /**
     * Overall SLA compliance percentage (0–100) for tickets in range.
     * Returns null if no SLA records exist for the period.
     */
    public function slaCompliancePct(Carbon $from, Carbon $to): ?float
    {
        $total = DB::table('sla_records')
            ->join('tickets', 'sla_records.ticket_id', '=', 'tickets.id')
            ->whereNull('tickets.deleted_at')
            ->whereBetween('tickets.created_at', [$from, $to])
            ->count();

        if ($total === 0) {
            return null;
        }

        $breached = DB::table('sla_records')
            ->join('tickets', 'sla_records.ticket_id', '=', 'tickets.id')
            ->whereNull('tickets.deleted_at')
            ->whereBetween('tickets.created_at', [$from, $to])
            ->where(fn ($q) =>
                $q->where('sla_records.first_response_breached', true)
                  ->orWhere('sla_records.resolution_breached', true)
            )
            ->count();

        return round((($total - $breached) / $total) * 100, 1);
    }

    /**
     * Detailed SLA compliance breakdown by type.
     *
     * @return array{total: int, first_response_breached: int, resolution_breached: int, compliant: int, compliance_pct: float|null}
     */
    public function slaCompliance(Carbon $from, Carbon $to): array
    {
        $rows = DB::table('sla_records')
            ->join('tickets', 'sla_records.ticket_id', '=', 'tickets.id')
            ->whereNull('tickets.deleted_at')
            ->whereBetween('tickets.created_at', [$from, $to])
            ->selectRaw('
                COUNT(*) as total,
                SUM(sla_records.first_response_breached) as fr_breached,
                SUM(sla_records.resolution_breached) as res_breached,
                SUM(CASE WHEN sla_records.first_response_breached = 0 AND sla_records.resolution_breached = 0 THEN 1 ELSE 0 END) as compliant
            ')
            ->first();

        $total    = (int) ($rows->total ?? 0);
        $compliant = (int) ($rows->compliant ?? 0);

        return [
            'total'                    => $total,
            'first_response_breached'  => (int) ($rows->fr_breached ?? 0),
            'resolution_breached'      => (int) ($rows->res_breached ?? 0),
            'compliant'                => $compliant,
            'compliance_pct'           => $total > 0 ? round(($compliant / $total) * 100, 1) : null,
        ];
    }

    /* ── Agent Performance ───────────────────────────────────────────────── */

    /**
     * Per-agent scorecard: tickets handled, avg resolution, avg first response, SLA compliance %.
     *
     * @return array<int, array{agent_id: int, agent: string, tickets_handled: int, avg_resolution_minutes: float|null, avg_first_response_minutes: float|null, sla_compliance_pct: float|null}>
     */
    public function agentPerformance(Carbon $from, Carbon $to): array
    {
        // Tickets closed in period per agent
        $handled = DB::table('tickets')
            ->join('users', 'tickets.assignee_id', '=', 'users.id')
            ->whereNull('tickets.deleted_at')
            ->whereNull('tickets.merged_into_id')
            ->whereBetween('tickets.closed_at', [$from, $to])
            ->whereNotNull('tickets.assignee_id')
            ->selectRaw('
                users.id as agent_id,
                users.name as agent,
                COUNT(*) as handled,
                AVG(TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.closed_at)) as avg_res,
                AVG(CASE WHEN tickets.first_response_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.first_response_at) ELSE NULL END) as avg_fr
            ')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('handled')
            ->get();

        // SLA compliance per agent
        $slaRows = DB::table('sla_records')
            ->join('tickets', 'sla_records.ticket_id', '=', 'tickets.id')
            ->whereNull('tickets.deleted_at')
            ->whereBetween('tickets.created_at', [$from, $to])
            ->whereNotNull('tickets.assignee_id')
            ->selectRaw('
                tickets.assignee_id,
                COUNT(*) as total,
                SUM(CASE WHEN sla_records.first_response_breached = 0 AND sla_records.resolution_breached = 0 THEN 1 ELSE 0 END) as compliant
            ')
            ->groupBy('tickets.assignee_id')
            ->get()
            ->keyBy('assignee_id');

        return $handled->map(function ($r) use ($slaRows) {
            $sla   = $slaRows->get($r->agent_id);
            $total = (int) ($sla->total ?? 0);

            return [
                'agent_id'                    => (int) $r->agent_id,
                'agent'                       => $r->agent,
                'tickets_handled'             => (int) $r->handled,
                'avg_resolution_minutes'      => $r->avg_res !== null ? round((float) $r->avg_res, 1) : null,
                'avg_first_response_minutes'  => $r->avg_fr !== null ? round((float) $r->avg_fr, 1) : null,
                'sla_compliance_pct'          => $total > 0
                    ? round(((int) $sla->compliant / $total) * 100, 1)
                    : null,
            ];
        })->all();
    }

    /* ── Team Comparison ─────────────────────────────────────────────────── */

    /**
     * Per-team: tickets handled, avg resolution time.
     *
     * @return array<int, array{team: string, tickets_handled: int, avg_resolution_minutes: float|null}>
     */
    public function teamComparison(Carbon $from, Carbon $to): array
    {
        return DB::table('tickets')
            ->join('teams', 'tickets.team_id', '=', 'teams.id')
            ->whereNull('tickets.deleted_at')
            ->whereNull('tickets.merged_into_id')
            ->whereBetween('tickets.closed_at', [$from, $to])
            ->whereNotNull('tickets.team_id')
            ->selectRaw('
                teams.name as team,
                COUNT(*) as handled,
                AVG(TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.closed_at)) as avg_res
            ')
            ->groupBy('teams.id', 'teams.name')
            ->orderByDesc('handled')
            ->get()
            ->map(fn ($r) => [
                'team'                   => $r->team,
                'tickets_handled'        => (int) $r->handled,
                'avg_resolution_minutes' => $r->avg_res !== null ? round((float) $r->avg_res, 1) : null,
            ])
            ->all();
    }

    /* ── Ticket Breakdowns ───────────────────────────────────────────────── */

    /**
     * Ticket count by priority for tickets created in range.
     *
     * @return array<int, array{priority: string, count: int}>
     */
    public function ticketsByPriority(Carbon $from, Carbon $to): array
    {
        return DB::table('tickets')
            ->whereNull('deleted_at')
            ->whereNull('merged_into_id')
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('priority, COUNT(*) as cnt')
            ->groupBy('priority')
            ->orderByRaw("FIELD(priority, 'critical','high','medium','low')")
            ->get()
            ->map(fn ($r) => ['priority' => $r->priority, 'count' => (int) $r->cnt])
            ->all();
    }

    /**
     * Ticket count by status for tickets currently in that status.
     *
     * @return array<int, array{status: string, count: int, is_closed: bool}>
     */
    public function ticketsByStatus(Carbon $from, Carbon $to): array
    {
        return DB::table('tickets')
            ->join('ticket_statuses', 'tickets.status_id', '=', 'ticket_statuses.id')
            ->whereNull('tickets.deleted_at')
            ->whereNull('tickets.merged_into_id')
            ->whereBetween('tickets.created_at', [$from, $to])
            ->selectRaw('ticket_statuses.name as status, ticket_statuses.is_closed, COUNT(*) as cnt')
            ->groupBy('ticket_statuses.id', 'ticket_statuses.name', 'ticket_statuses.is_closed')
            ->orderBy('ticket_statuses.sort_order')
            ->get()
            ->map(fn ($r) => [
                'status'    => $r->status,
                'count'     => (int) $r->cnt,
                'is_closed' => (bool) $r->is_closed,
            ])
            ->all();
    }

    /**
     * Ticket count by category for tickets created in range.
     *
     * @return array<int, array{category: string, count: int}>
     */
    public function ticketsByCategory(Carbon $from, Carbon $to): array
    {
        return DB::table('tickets')
            ->leftJoin('ticket_categories', 'tickets.category_id', '=', 'ticket_categories.id')
            ->whereNull('tickets.deleted_at')
            ->whereNull('tickets.merged_into_id')
            ->whereBetween('tickets.created_at', [$from, $to])
            ->selectRaw('COALESCE(ticket_categories.name, "Uncategorised") as category, COUNT(*) as cnt')
            ->groupBy('ticket_categories.id', 'ticket_categories.name')
            ->orderByDesc('cnt')
            ->get()
            ->map(fn ($r) => ['category' => $r->category, 'count' => (int) $r->cnt])
            ->all();
    }

    /* ── Custom Report ───────────────────────────────────────────────────── */

    /**
     * Flexible query for the custom report builder.
     *
     * @param array{
     *   from: Carbon,
     *   to: Carbon,
     *   metric: string,
     *   group_by: string,
     *   filters: array{priority?: string, status_id?: int, category_id?: int, assignee_id?: int, team_id?: int}
     * } $params
     */
    public function customReport(array $params): array
    {
        $from    = $params['from'];
        $to      = $params['to'];
        $metric  = $params['metric']  ?? 'volume';
        $groupBy = $params['group_by'] ?? 'day';
        $filters = $params['filters']  ?? [];

        $query = DB::table('tickets')
            ->whereNull('tickets.deleted_at')
            ->whereNull('tickets.merged_into_id')
            ->whereBetween('tickets.created_at', [$from, $to]);

        // Apply filters
        if (!empty($filters['priority'])) {
            $query->where('tickets.priority', $filters['priority']);
        }
        if (!empty($filters['status_id'])) {
            $query->where('tickets.status_id', (int) $filters['status_id']);
        }
        if (!empty($filters['category_id'])) {
            $query->where('tickets.category_id', (int) $filters['category_id']);
        }
        if (!empty($filters['assignee_id'])) {
            $query->where('tickets.assignee_id', (int) $filters['assignee_id']);
        }
        if (!empty($filters['team_id'])) {
            $query->where('tickets.team_id', (int) $filters['team_id']);
        }

        // Determine group column
        $groupColumn = match ($groupBy) {
            'priority' => 'tickets.priority',
            'status'   => 'ticket_statuses.name',
            'category' => 'ticket_categories.name',
            'agent'    => 'users.name',
            'team'     => 'teams.name',
            'month'    => null,
            'week'     => null,
            default    => null, // day
        };

        if ($groupBy === 'status') {
            $query->leftJoin('ticket_statuses', 'tickets.status_id', '=', 'ticket_statuses.id');
        }
        if ($groupBy === 'category') {
            $query->leftJoin('ticket_categories', 'tickets.category_id', '=', 'ticket_categories.id');
        }
        if ($groupBy === 'agent') {
            $query->leftJoin('users', 'tickets.assignee_id', '=', 'users.id');
        }
        if ($groupBy === 'team') {
            $query->leftJoin('teams', 'tickets.team_id', '=', 'teams.id');
        }

        // Determine select + group
        if ($groupColumn) {
            $labelExpr = "COALESCE({$groupColumn}, 'None') as label";
            $rows = $query
                ->selectRaw("{$labelExpr}, COUNT(*) as cnt, AVG(TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.closed_at)) as avg_res")
                ->groupByRaw($groupColumn ? "COALESCE({$groupColumn}, 'None')" : '1')
                ->orderByDesc('cnt')
                ->get();
        } else {
            $dateFmt = match ($groupBy) {
                'month' => '%Y-%m',
                'week'  => '%Y-%u',
                default => '%Y-%m-%d',
            };
            $rows = $query
                ->selectRaw("DATE_FORMAT(tickets.created_at, '{$dateFmt}') as label, COUNT(*) as cnt, AVG(TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.closed_at)) as avg_res")
                ->groupBy('label')
                ->orderBy('label')
                ->get();
        }

        return $rows->map(fn ($r) => [
            'label'                  => $r->label,
            'count'                  => (int) $r->cnt,
            'avg_resolution_minutes' => $r->avg_res !== null ? round((float) $r->avg_res, 1) : null,
        ])->all();
    }

    /* ── Helpers ─────────────────────────────────────────────────────────── */

    public static function formatMinutes(?float $minutes): string
    {
        if ($minutes === null) {
            return '—';
        }

        if ($minutes < 60) {
            return round($minutes) . 'm';
        }

        $h = floor($minutes / 60);
        $m = round($minutes % 60);

        return $m > 0 ? "{$h}h {$m}m" : "{$h}h";
    }
}
