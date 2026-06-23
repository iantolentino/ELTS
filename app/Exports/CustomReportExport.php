<?php

declare(strict_types=1);

namespace App\Exports;

use App\Services\ReportService;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class CustomReportExport implements FromArray, WithHeadings, WithTitle, ShouldAutoSize
{
    private int $total;

    public function __construct(
        private readonly array  $results,
        private readonly string $groupLabel,
        private readonly string $metricLabel,
        private readonly string $from,
        private readonly string $to,
    ) {
        $this->total = array_sum(array_column($results, 'count'));
    }

    public function title(): string
    {
        return 'Custom Report';
    }

    public function headings(): array
    {
        return [
            $this->groupLabel,
            'Tickets',
            '% of Total',
            'Avg Resolution (min)',
            'Avg Resolution',
        ];
    }

    public function array(): array
    {
        $rows = array_map(fn ($r) => [
            ucfirst((string) $r['label']),
            $r['count'],
            $this->total > 0 ? round(($r['count'] / $this->total) * 100, 1) : 0,
            $r['avg_resolution_minutes'],
            $r['avg_resolution_minutes'] !== null
                ? ReportService::formatMinutes((float) $r['avg_resolution_minutes'])
                : '—',
        ], $this->results);

        $rows[] = ['Total', $this->total, 100.0, '', ''];

        return $rows;
    }
}
