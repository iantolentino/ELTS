<?php
declare(strict_types=1);
namespace App\Events;

use App\Models\SlaRecord;
use App\Models\Ticket;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SLAWarning
{
    use Dispatchable, SerializesModels;

    /**
     * @param  string  $type  'first_response' | 'resolution'
     */
    public function __construct(
        public readonly Ticket    $ticket,
        public readonly SlaRecord $record,
        public readonly string    $type,
    ) {}
}
