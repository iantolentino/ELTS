<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\SLABreached;
use App\Events\SLAWarning;
use App\Models\SlaRecord;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Collection;

class CheckSLABreaches implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $this->checkFirstResponseWarnings();
        $this->checkResolutionWarnings();
        $this->checkFirstResponse();
        $this->checkResolution();
    }

    private function isAt75Percent(\Carbon\Carbon $start, \Carbon\Carbon $due): bool
    {
        $total   = $start->diffInSeconds($due);
        $elapsed = $start->diffInSeconds(now());
        return $total > 0 && ($elapsed / $total) >= 0.75;
    }

    private function checkFirstResponseWarnings(): void
    {
        SlaRecord::query()
            ->whereNotNull('first_response_due')
            ->where('first_response_due', '>', now())
            ->where('first_response_warning_sent', false)
            ->whereNull('first_response_met_at')
            ->with('ticket')
            ->chunkById(100, function (Collection $records): void {
                foreach ($records as $record) {
                    if ($this->isAt75Percent($record->created_at, $record->first_response_due)) {
                        $record->update(['first_response_warning_sent' => true]);
                        if ($record->ticket) {
                            SLAWarning::dispatch($record->ticket, $record, 'first_response');
                        }
                    }
                }
            });
    }

    private function checkResolutionWarnings(): void
    {
        SlaRecord::query()
            ->whereNotNull('resolution_due')
            ->where('resolution_due', '>', now())
            ->where('resolution_warning_sent', false)
            ->whereNull('resolution_met_at')
            ->with('ticket')
            ->chunkById(100, function (Collection $records): void {
                foreach ($records as $record) {
                    if ($this->isAt75Percent($record->created_at, $record->resolution_due)) {
                        $record->update(['resolution_warning_sent' => true]);
                        if ($record->ticket) {
                            SLAWarning::dispatch($record->ticket, $record, 'resolution');
                        }
                    }
                }
            });
    }

    private function checkFirstResponse(): void
    {
        SlaRecord::query()
            ->whereNotNull('first_response_due')
            ->where('first_response_due', '<', now())
            ->where('first_response_breached', false)
            ->whereNull('first_response_met_at')
            ->with('ticket')
            ->chunkById(100, function (Collection $records): void {
                foreach ($records as $record) {
                    $record->update(['first_response_breached' => true]);

                    if ($record->ticket) {
                        SLABreached::dispatch($record->ticket, $record, 'first_response');
                    }
                }
            });
    }

    private function checkResolution(): void
    {
        SlaRecord::query()
            ->whereNotNull('resolution_due')
            ->where('resolution_due', '<', now())
            ->where('resolution_breached', false)
            ->whereNull('resolution_met_at')
            ->with('ticket')
            ->chunkById(100, function (Collection $records): void {
                foreach ($records as $record) {
                    $record->update(['resolution_breached' => true]);

                    if ($record->ticket) {
                        SLABreached::dispatch($record->ticket, $record, 'resolution');
                    }
                }
            });
    }
}
