<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly ReportService $reports) {}

    public function __invoke(Request $request): Response
    {
        $from = $request->input('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : now()->startOfMonth()->startOfDay();

        $to = $request->input('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : now()->endOfDay();

        $granularity = $request->input('granularity', 'day');

        $kpis  = $this->reports->kpiSummary($from, $to);
        $trend = $this->reports->ticketVolumeTrend($from, $to, $granularity);
        $csat  = $this->reports->csatMetrics($from, $to);
        $csatTrend = $this->reports->csatTrend($from, $to, $granularity);
        $nps   = $this->reports->npsMetrics($from, $to);

        return Inertia::render('Dashboard/Index', [
            'kpis'        => $kpis,
            'trend'       => $trend,
            'csat'        => $csat,
            'csat_trend'  => $csatTrend,
            'nps'         => $nps,
            'filters'     => [
                'from'        => $from->toDateString(),
                'to'          => $to->toDateString(),
                'granularity' => $granularity,
            ],
        ]);
    }
}
