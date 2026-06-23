<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\GenerateScheduledReport;
use App\Models\ScheduledReport;
use Illuminate\Console\Command;

class DispatchScheduledReports extends Command
{
    protected $signature   = 'reports:dispatch-scheduled';
    protected $description = 'Dispatch GenerateScheduledReport jobs for any reports due at this minute';

    public function handle(): int
    {
        $now = now();

        ScheduledReport::where('is_active', true)->each(function (ScheduledReport $report) use ($now) {
            if ($this->isDue($report, $now)) {
                GenerateScheduledReport::dispatch($report);
                $this->line("Dispatched: {$report->name}");
            }
        });

        return self::SUCCESS;
    }

    private function isDue(ScheduledReport $report, \Carbon\Carbon $now): bool
    {
        // Compare HH:MM only (scheduler fires every minute)
        if ($now->format('H:i') !== substr($report->time_of_day, 0, 5)) {
            return false;
        }

        return match ($report->schedule) {
            'daily'   => true,
            'weekly'  => $now->dayOfWeek === $report->day_of_week,
            'monthly' => $now->day        === $report->day_of_month,
            default   => false,
        };
    }
}
