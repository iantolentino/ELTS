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

        $kpis  = $this->reports->kpiSummary($from, $to);
        $trend = $this->reports->ticketVolumeTrend($from, $to, $request->input('granularity', 'day'));

        return Inertia::render('Dashboard/Index', [
            'kpis'        => $kpis,
            'trend'       => $trend,
            'filters'     => [
                'from'        => $from->toDateString(),
                'to'          => $to->toDateString(),
                'granularity' => $request->input('granularity', 'day'),
            ],
        ]);
    }
}
