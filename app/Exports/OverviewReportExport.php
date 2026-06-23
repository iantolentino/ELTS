<?php

declare(strict_types=1);

namespace App\Exports;

use App\Services\ReportService;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;

class OverviewReportExport implements FromArray, WithTitle, ShouldAutoSize
{
    public function __construct(
        private readonly array  $kpis,
        private readonly array  $slaCompliance,
        private readonly array  $agentPerformance,
        private readonly array  $byPriority,
        private readonly array  $byStatus,
        private readonly array  $byCategory,
        private readonly string $from,
        private readonly string $to,
        private readonly string $generatedAt,
    ) {}

    public function title(): string
    {
        return 'Overview';
    }

    public function array(): array
    {
        $fmt = fn (?float $v) => $v !== null ? ReportService::formatMinutes($v) : '—';

        $rows = [];

        $rows[] = ['Reports Overview'];
        $rows[] = ['Period', "{$this->from} — {$this->to}"];
        $rows[] = ['Generated', $this->generatedAt];
        $rows[] = [];

        // ── KPI Summary ─────────────────────────────────────────────────────
        $rows[] = ['KPI SUMMARY'];
        $rows[] = ['Metric', 'Value'];
        $rows[] = ['Tickets Created',     $this->kpis['ticket_volume']];
        $rows[] = ['Open Tickets',        $this->kpis['open_tickets']];
        $rows[] = ['Avg First Response',  $fmt($this->kpis['avg_first_response_minutes'])];
        $rows[] = ['Avg Resolution',      $fmt($this->kpis['avg_resolution_minutes'])];
        $rows[] = ['SLA Compliance',
            $this->kpis['sla_compliance_pct'] !== null
                ? $this->kpis['sla_compliance_pct'] . '%'
                : '—',
        ];
        $rows[] = [];

        // ── SLA Compliance ───────────────────────────────────────────────────
        $rows[] = ['SLA COMPLIANCE'];
        $rows[] = ['Metric', 'Count'];
        $rows[] = ['Total SLA Tickets',        $this->slaCompliance['total']];
        $rows[] = ['Fully Compliant',           $this->slaCompliance['compliant']];
        $rows[] = ['First Response Breached',   $this->slaCompliance['first_response_breached']];
        $rows[] = ['Resolution Breached',       $this->slaCompliance['resolution_breached']];
        $rows[] = ['Compliance Rate',
            $this->slaCompliance['compliance_pct'] !== null
                ? $this->slaCompliance['compliance_pct'] . '%'
                : '—',
        ];
        $rows[] = [];

        // ── By Priority ──────────────────────────────────────────────────────
        $rows[] = ['TICKET BREAKDOWN — BY PRIORITY'];
        $rows[] = ['Priority', 'Count'];
        foreach ($this->byPriority as $r) {
            $rows[] = [ucfirst($r['priority']), $r['count']];
        }
        $rows[] = [];

        // ── By Status ────────────────────────────────────────────────────────
        $rows[] = ['TICKET BREAKDOWN — BY STATUS'];
        $rows[] = ['Status', 'Count', 'Closed?'];
        foreach ($this->byStatus as $r) {
            $rows[] = [$r['status'], $r['count'], $r['is_closed'] ? 'Yes' : 'No'];
        }
        $rows[] = [];

        // ── By Category ──────────────────────────────────────────────────────
        $rows[] = ['TICKET BREAKDOWN — BY CATEGORY'];
        $rows[] = ['Category', 'Count'];
        foreach ($this->byCategory as $r) {
            $rows[] = [$r['category'], $r['count']];
        }
        $rows[] = [];

        // ── Agent Performance ────────────────────────────────────────────────
        if (count($this->agentPerformance) > 0) {
            $rows[] = ['AGENT PERFORMANCE'];
            $rows[] = ['Agent', 'Tickets Handled', 'Avg 1st Response', 'Avg Resolution', 'SLA %'];
            foreach ($this->agentPerformance as $r) {
                $rows[] = [
                    $r['agent'],
                    $r['tickets_handled'],
                    $fmt($r['avg_first_response_minutes']),
                    $fmt($r['avg_resolution_minutes']),
                    $r['sla_compliance_pct'] !== null ? $r['sla_compliance_pct'] . '%' : '—',
                ];
            }
        }

        return $rows;
    }
}
