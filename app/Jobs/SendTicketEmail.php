<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Mail\TicketMail;
use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendTicketEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $backoff = 60;

    public function __construct(
        private Ticket $ticket,
        private string $event,
        private string $recipientEmail,
        private string $recipientName,
        private array  $extra = [],
        private array  $cc    = [],
    ) {}

    public function handle(): void
    {
        $mail = Mail::to($this->recipientEmail, $this->recipientName);

        if (!empty($this->cc)) {
            $mail->cc($this->cc);
        }

        $mail->send(new TicketMail($this->ticket, $this->event, $this->extra));
    }
}
