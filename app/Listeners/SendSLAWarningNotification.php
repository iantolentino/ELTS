<?php
declare(strict_types=1);
namespace App\Listeners;

use App\Events\SLAWarning;
use App\Notifications\SLAWarningNotification;

class SendSLAWarningNotification
{
    public function handle(SLAWarning $event): void
    {
        $ticket = $event->ticket->load(['assignee']);

        if ($ticket->assignee) {
            $ticket->assignee->notify(new SLAWarningNotification($ticket, $event->type));
        }
    }
}
