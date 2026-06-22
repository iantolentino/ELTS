<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\MailboxService;
use Illuminate\Console\Command;

class PollMailboxes extends Command
{
    protected $signature   = 'mailboxes:poll';
    protected $description = 'Poll all active IMAP mailboxes and queue new emails for processing';

    public function handle(MailboxService $service): int
    {
        $count = $service->pollAllActive();
        $this->info("Polled all active mailboxes — {$count} new email(s) queued for processing.");

        return Command::SUCCESS;
    }
}
