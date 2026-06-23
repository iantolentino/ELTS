<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Exports\CustomReportExport;
use App\Exports\OverviewReportExport;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportsController extends Controller
{
    public function __construct(private readonly ReportService $reports) {}

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', \App\Models\Ticket::class);

        $from    = Carbon::parse($request->input('from', now()->subDays(29)->startOfDay()));
        $to      = Carbon::parse($request->input('to',   now()->endOfDay()));
        $groupBy = $request->input('group_by', 'agent');

        $firstResponse = $groupBy === 'team'
            ? $this->reports->firstResponseByTeam($from, $to)
            : $this->reports->firstResponseByAgent($from, $to);

        $slaCompliance    = $this->reports->slaCompliance($from, $to);
        $agentPerformance = $this->reports->agentPerformance($from, $to);
        $teamComparison    = $this->reports->teamComparison($from, $to);
        $byPriority        = $this->reports->ticketsByPriority($from, $to);
        $byStatus          = $this->reports->ticketsByStatus($from, $to);
        $byCategory        = $this->reports->ticketsByCategory($from, $to);

        return Inertia::render('Reports/Index', [
            'first_response'    => $firstResponse,
            'sla_compliance'    => $slaCompliance,
            'agent_performance' => $agentPerformance,
            'team_comparison'   => $teamComparison,
            'by_priority'       => $byPriority,
            'by_status'         => $byStatus,
            'by_category'       => $byCategory,
            'filters'        => [
                'from'     => $from->toDateString(),
                'to'       => $to->toDateString(),
                'group_by' => $groupBy,
            ],
        ]);
    }

    public function custom(Request $request): Response
    {
        Gate::authorize('viewAny', \App\Models\Ticket::class);

        $from    = Carbon::parse($request->input('from', now()->subDays(29)->startOfDay()));
        $to      = Carbon::parse($request->input('to',   now()->endOfDay()));
        $metric  = $request->input('metric',   'volume');
        $groupBy = $request->input('group_by', 'day');

        $rawFilters = [
            'priority'    => $request->input('priority'),
            'status_id'   => $request->input('status_id')   ? (int) $request->input('status_id')   : null,
            'category_id' => $request->input('category_id') ? (int) $request->input('category_id') : null,
            'assignee_id' => $request->input('assignee_id') ? (int) $request->input('assignee_id') : null,
            'team_id'     => $request->input('team_id')     ? (int) $request->input('team_id')     : null,
        ];
        $filters = array_filter($rawFilters, fn ($v) => $v !== null && $v !== '');

        $results = $this->reports->customReport([
            'from'     => $from,
            'to'       => $to,
            'metric'   => $metric,
            'group_by' => $groupBy,
            'filters'  => $filters,
        ]);

        $statuses = DB::table('ticket_statuses')
            ->orderBy('sort_order')
            ->get(['id', 'name'])
            ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])
            ->all();

        $categories = DB::table('ticket_categories')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])
            ->all();

        $agents = DB::table('users')
            ->join('model_has_roles', function ($join) {
                $join->on('users.id', '=', 'model_has_roles.model_id')
                     ->where('model_has_roles.model_type', 'App\\Models\\User');
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('users.is_active', true)
            ->whereNotIn('roles.name', ['client'])
            ->distinct()
            ->orderBy('users.name')
            ->get(['users.id', 'users.name'])
            ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])
            ->all();

        $teams = DB::table('teams')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])
            ->all();

        return Inertia::render('Reports/Custom', [
            'results'    => $results,
            'statuses'   => $statuses,
            'categories' => $categories,
            'agents'     => $agents,
            'teams'      => $teams,
            'filters'    => [
                'from'        => $from->toDateString(),
                'to'          => $to->toDateString(),
                'metric'      => $metric,
                'group_by'    => $groupBy,
                'priority'    => $request->input('priority', ''),
                'status_id'   => $request->input('status_id', ''),
                'category_id' => $request->input('category_id', ''),
                'assignee_id' => $request->input('assignee_id', ''),
                'team_id'     => $request->input('team_id', ''),
            ],
        ]);
    }

    public function exportPdf(Request $request): HttpResponse
    {
        Gate::authorize('viewAny', \App\Models\Ticket::class);

        $from    = Carbon::parse($request->input('from', now()->subDays(29)->startOfDay()));
        $to      = Carbon::parse($request->input('to',   now()->endOfDay()));
        $groupBy = $request->input('group_by', 'agent');

        $firstResponse = $groupBy === 'team'
            ? $this->reports->firstResponseByTeam($from, $to)
            : $this->reports->firstResponseByAgent($from, $to);

        $pdf = Pdf::loadView('reports.overview-pdf', [
            'kpis'              => $this->reports->kpiSummary($from, $to),
            'sla_compliance'    => $this->reports->slaCompliance($from, $to),
            'agent_performance' => $this->reports->agentPerformance($from, $to),
            'by_priority'       => $this->reports->ticketsByPriority($from, $to),
            'by_status'         => $this->reports->ticketsByStatus($from, $to),
            'by_category'       => $this->reports->ticketsByCategory($from, $to),
            'from'              => $from->toDateString(),
            'to'                => $to->toDateString(),
            'generated_at'      => now()->format('Y-m-d H:i'),
        ])->setPaper('a4', 'portrait');

        return $pdf->download('reports-overview-' . now()->format('Ymd') . '.pdf');
    }

    public function exportCustomPdf(Request $request): HttpResponse
    {
        Gate::authorize('viewAny', \App\Models\Ticket::class);

        $from    = Carbon::parse($request->input('from', now()->subDays(29)->startOfDay()));
        $to      = Carbon::parse($request->input('to',   now()->endOfDay()));
        $metric  = $request->input('metric',   'volume');
        $groupBy = $request->input('group_by', 'day');

        $rawFilters = [
            'priority'    => $request->input('priority'),
            'status_id'   => $request->input('status_id')   ? (int) $request->input('status_id')   : null,
            'category_id' => $request->input('category_id') ? (int) $request->input('category_id') : null,
            'assignee_id' => $request->input('assignee_id') ? (int) $request->input('assignee_id') : null,
            'team_id'     => $request->input('team_id')     ? (int) $request->input('team_id')     : null,
        ];
        $filters = array_filter($rawFilters, fn ($v) => $v !== null && $v !== '');

        $results = $this->reports->customReport([
            'from'     => $from,
            'to'       => $to,
            'metric'   => $metric,
            'group_by' => $groupBy,
            'filters'  => $filters,
        ]);

        $metricLabels = ['volume' => 'Ticket Volume', 'avg_resolution' => 'Avg Resolution Time'];
        $groupLabels  = [
            'day' => 'Day', 'week' => 'Week', 'month' => 'Month',
            'priority' => 'Priority', 'status' => 'Status', 'category' => 'Category',
            'agent' => 'Agent', 'team' => 'Team',
        ];

        $filtersApplied = [];
        if ($request->input('priority'))    $filtersApplied[] = 'Priority: ' . ucfirst($request->input('priority'));
        if ($request->input('status_id'))   $filtersApplied[] = 'Status ID: ' . $request->input('status_id');
        if ($request->input('category_id')) $filtersApplied[] = 'Category ID: ' . $request->input('category_id');
        if ($request->input('assignee_id')) $filtersApplied[] = 'Agent ID: ' . $request->input('assignee_id');
        if ($request->input('team_id'))     $filtersApplied[] = 'Team ID: ' . $request->input('team_id');

        $pdf = Pdf::loadView('reports.custom-pdf', [
            'results'         => $results,
            'metric_label'    => $metricLabels[$metric]  ?? $metric,
            'group_label'     => $groupLabels[$groupBy]  ?? $groupBy,
            'from'            => $from->toDateString(),
            'to'              => $to->toDateString(),
            'filters_applied' => $filtersApplied,
            'generated_at'    => now()->format('Y-m-d H:i'),
        ])->setPaper('a4', 'portrait');

        return $pdf->download('custom-report-' . now()->format('Ymd') . '.pdf');
    }

    public function exportOverviewExcel(Request $request): BinaryFileResponse
    {
        Gate::authorize('viewAny', \App\Models\Ticket::class);

        $from = Carbon::parse($request->input('from', now()->subDays(29)->startOfDay()));
        $to   = Carbon::parse($request->input('to',   now()->endOfDay()));

        return Excel::download(
            new OverviewReportExport(
                kpis:             $this->reports->kpiSummary($from, $to),
                slaCompliance:    $this->reports->slaCompliance($from, $to),
                agentPerformance: $this->reports->agentPerformance($from, $to),
                byPriority:       $this->reports->ticketsByPriority($from, $to),
                byStatus:         $this->reports->ticketsByStatus($from, $to),
                byCategory:       $this->reports->ticketsByCategory($from, $to),
                from:             $from->toDateString(),
                to:               $to->toDateString(),
                generatedAt:      now()->format('Y-m-d H:i'),
            ),
            'reports-overview-' . now()->format('Ymd') . '.xlsx',
        );
    }

    public function exportExcel(Request $request): BinaryFileResponse
    {
        Gate::authorize('viewAny', \App\Models\Ticket::class);

        [$results, $metricLabel, $groupLabel] = $this->resolveCustomParams($request);

        return Excel::download(
            new CustomReportExport(
                results:     $results,
                groupLabel:  $groupLabel,
                metricLabel: $metricLabel,
                from:        Carbon::parse($request->input('from', now()->subDays(29)))->toDateString(),
                to:          Carbon::parse($request->input('to',   now()))->toDateString(),
            ),
            'custom-report-' . now()->format('Ymd') . '.xlsx',
        );
    }

    public function exportCsv(Request $request): BinaryFileResponse
    {
        Gate::authorize('viewAny', \App\Models\Ticket::class);

        [$results, $metricLabel, $groupLabel] = $this->resolveCustomParams($request);

        return Excel::download(
            new CustomReportExport(
                results:     $results,
                groupLabel:  $groupLabel,
                metricLabel: $metricLabel,
                from:        Carbon::parse($request->input('from', now()->subDays(29)))->toDateString(),
                to:          Carbon::parse($request->input('to',   now()))->toDateString(),
            ),
            'custom-report-' . now()->format('Ymd') . '.csv',
            \Maatwebsite\Excel\Excel::CSV,
        );
    }

    private function resolveCustomParams(Request $request): array
    {
        $from    = Carbon::parse($request->input('from', now()->subDays(29)->startOfDay()));
        $to      = Carbon::parse($request->input('to',   now()->endOfDay()));
        $metric  = $request->input('metric',   'volume');
        $groupBy = $request->input('group_by', 'day');

        $rawFilters = [
            'priority'    => $request->input('priority'),
            'status_id'   => $request->input('status_id')   ? (int) $request->input('status_id')   : null,
            'category_id' => $request->input('category_id') ? (int) $request->input('category_id') : null,
            'assignee_id' => $request->input('assignee_id') ? (int) $request->input('assignee_id') : null,
            'team_id'     => $request->input('team_id')     ? (int) $request->input('team_id')     : null,
        ];
        $filters = array_filter($rawFilters, fn ($v) => $v !== null && $v !== '');

        $results = $this->reports->customReport([
            'from' => $from, 'to' => $to, 'metric' => $metric,
            'group_by' => $groupBy, 'filters' => $filters,
        ]);

        $metricLabels = ['volume' => 'Ticket Volume', 'avg_resolution' => 'Avg Resolution Time'];
        $groupLabels  = [
            'day' => 'Day', 'week' => 'Week', 'month' => 'Month',
            'priority' => 'Priority', 'status' => 'Status', 'category' => 'Category',
            'agent' => 'Agent', 'team' => 'Team',
        ];

        return [
            $results,
            $metricLabels[$metric]  ?? $metric,
            $groupLabels[$groupBy]  ?? $groupBy,
        ];
    }
}
