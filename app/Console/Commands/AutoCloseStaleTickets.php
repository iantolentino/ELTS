<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Models\TicketNote;
use App\Models\TicketStatus;
use Illuminate\Console\Command;

class AutoCloseStaleTickets extends Command
{
    protected $signature = 'tickets:auto-close {--days=30 : Number of idle days before auto-closing}';
    protected $description = 'Close tickets that have had no activity for the configured number of days';

    public function handle(): int
    {
        $days = (int) $this->option('days');

        $closedStatus = TicketStatus::where('is_closed', true)->orderBy('sort_order')->first();

        if (!$closedStatus) {
            $this->error('No closed status found. Create one in Admin → Statuses first.');
            return self::FAILURE;
        }

        $cutoff = now()->subDays($days);

        $query = Ticket::whereNull('closed_at')
            ->whereNull('merged_into_id')
            ->whereHas('status', fn ($q) => $q->where('is_closed', false))
            ->where(function ($q) use ($cutoff) {
                $q->where('updated_at', '<=', $cutoff)
                    ->doesntHave('replies', 'and', fn ($r) => $r->where('created_at', '>', $cutoff));
            });

        $count = 0;

        $query->chunkById(100, function ($tickets) use ($closedStatus, &$count) {
            foreach ($tickets as $ticket) {
                $ticket->update([
                    'status_id' => $closedStatus->id,
                    'closed_at' => now(),
                ]);

                TicketNote::create([
                    'ticket_id' => $ticket->id,
                    'user_id'   => null,
                    'body'      => '[Auto-close] Ticket closed automatically due to inactivity.',
                    'is_html'   => false,
                ]);

                $count++;
            }
        });

        $this->info("Auto-closed {$count} stale ticket(s) (idle >{$days} days).");

        return self::SUCCESS;
    }
}
