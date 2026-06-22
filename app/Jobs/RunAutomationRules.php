<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Ticket;
use App\Services\AutomationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RunAutomationRules implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    public function __construct(
        public readonly Ticket $ticket,
        public readonly string $event,
    ) {}

    public function handle(AutomationService $automationService): void
    {
        if (!$this->ticket->exists || $this->ticket->trashed()) {
            return;
        }

        $fresh = $this->ticket->fresh(['status', 'category', 'assignee', 'team', 'tags', 'requester']);

        if (!$fresh) {
            return;
        }

        $automationService->evaluate($fresh, $this->event);
    }

    public function failed(\Throwable $e): void
    {
        Log::error("RunAutomationRules failed for ticket #{$this->ticket->id} event={$this->event}: {$e->getMessage()}");
    }
}
