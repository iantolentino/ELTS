<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\SLABreached;
use App\Models\SlaRecord;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Collection;

class CheckSLABreaches implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        $this->checkFirstResponse();
        $this->checkResolution();
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
