<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Exports\CustomReportExport;
use App\Exports\OverviewReportExport;
use App\Mail\ScheduledReportMail;
use App\Models\ScheduledReport;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class GenerateScheduledReport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 120;

    public function __construct(private readonly ScheduledReport $report) {}

    public function handle(ReportService $reports): void
    {
        [$from, $to] = $this->dateRange();

        [$content, $filename, $mimeType] = $this->buildExport($reports, $from, $to);

        foreach ($this->report->recipients as $email) {
            Mail::to($email)->send(
                new ScheduledReportMail($this->report, $from, $to, $content, $filename, $mimeType)
            );
        }
    }

    /* ── Date Range ────────────────────────────────────────────────────────── */

    private function dateRange(): array
    {
        return match ($this->report->schedule) {
            'daily'   => [now()->subDay()->startOfDay(),   now()->subDay()->endOfDay()],
            'weekly'  => [now()->subWeek()->startOfWeek(), now()->subWeek()->endOfWeek()],
            'monthly' => [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()],
            default   => [now()->subDay()->startOfDay(),   now()->subDay()->endOfDay()],
        };
    }

    /* ── Export Builder ────────────────────────────────────────────────────── */

    private function buildExport(ReportService $reports, Carbon $from, Carbon $to): array
    {
        $type   = $this->report->type;
        $format = $this->report->format;
        $params = $this->report->params ?? [];
        $slug   = Str::slug($this->report->name);
        $dates  = $from->toDateString() . '_' . $to->toDateString();

        if ($format === 'pdf') {
            $content  = $this->buildPdf($reports, $type, $params, $from, $to);
            return [$content, "{$slug}-{$dates}.pdf", 'application/pdf'];
        }

        $writerType = $format === 'csv'
            ? \Maatwebsite\Excel\Excel::CSV
            : \Maatwebsite\Excel\Excel::XLSX;

        $ext      = $format === 'csv' ? 'csv' : 'xlsx';
        $mimeType = $format === 'csv'
            ? 'text/csv'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        $export  = $this->buildSpreadsheetExport($reports, $type, $params, $from, $to);
        $content = \Maatwebsite\Excel\Facades\Excel::raw($export, $writerType);

        return [$content, "{$slug}-{$dates}.{$ext}", $mimeType];
    }

    private function buildPdf(ReportService $reports, string $type, array $params, Carbon $from, Carbon $to): string
    {
        if ($type === 'overview') {
            return Pdf::loadView('reports.overview-pdf', [
                'kpis'              => $reports->kpiSummary($from, $to),
                'sla_compliance'    => $reports->slaCompliance($from, $to),
                'agent_performance' => $reports->agentPerformance($from, $to),
                'by_priority'       => $reports->ticketsByPriority($from, $to),
                'by_status'         => $reports->ticketsByStatus($from, $to),
                'by_category'       => $reports->ticketsByCategory($from, $to),
                'from'              => $from->toDateString(),
                'to'                => $to->toDateString(),
                'generated_at'      => now()->format('Y-m-d H:i'),
            ])->setPaper('a4', 'portrait')->output();
        }

        $groupLabels = [
            'day' => 'Day', 'week' => 'Week', 'month' => 'Month',
            'priority' => 'Priority', 'status' => 'Status', 'category' => 'Category',
            'agent' => 'Agent', 'team' => 'Team',
        ];
        $metricLabels = ['volume' => 'Ticket Volume', 'avg_resolution' => 'Avg Resolution Time'];
        $groupBy      = $params['group_by'] ?? 'day';
        $metric       = $params['metric']   ?? 'volume';

        $results = $reports->customReport([
            'from' => $from, 'to' => $to, 'metric' => $metric,
            'group_by' => $groupBy, 'filters' => [],
        ]);

        return Pdf::loadView('reports.custom-pdf', [
            'results'         => $results,
            'metric_label'    => $metricLabels[$metric]  ?? $metric,
            'group_label'     => $groupLabels[$groupBy]  ?? $groupBy,
            'from'            => $from->toDateString(),
            'to'              => $to->toDateString(),
            'filters_applied' => [],
            'generated_at'    => now()->format('Y-m-d H:i'),
        ])->setPaper('a4', 'portrait')->output();
    }

    private function buildSpreadsheetExport(ReportService $reports, string $type, array $params, Carbon $from, Carbon $to): object
    {
        if ($type === 'overview') {
            return new OverviewReportExport(
                kpis:             $reports->kpiSummary($from, $to),
                slaCompliance:    $reports->slaCompliance($from, $to),
                agentPerformance: $reports->agentPerformance($from, $to),
                byPriority:       $reports->ticketsByPriority($from, $to),
                byStatus:         $reports->ticketsByStatus($from, $to),
                byCategory:       $reports->ticketsByCategory($from, $to),
                from:             $from->toDateString(),
                to:               $to->toDateString(),
                generatedAt:      now()->format('Y-m-d H:i'),
            );
        }

        $groupBy = $params['group_by'] ?? 'day';
        $metric  = $params['metric']   ?? 'volume';
        $groupLabels  = ['day' => 'Day', 'week' => 'Week', 'month' => 'Month',
            'priority' => 'Priority', 'status' => 'Status', 'category' => 'Category',
            'agent' => 'Agent', 'team' => 'Team'];
        $metricLabels = ['volume' => 'Ticket Volume', 'avg_resolution' => 'Avg Resolution Time'];

        $results = $reports->customReport([
            'from' => $from, 'to' => $to, 'metric' => $metric,
            'group_by' => $groupBy, 'filters' => [],
        ]);

        return new CustomReportExport(
            results:     $results,
            groupLabel:  $groupLabels[$groupBy]  ?? $groupBy,
            metricLabel: $metricLabels[$metric]   ?? $metric,
            from:        $from->toDateString(),
            to:          $to->toDateString(),
        );
    }
}
