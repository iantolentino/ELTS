<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Mail\CsatSurveyMail;
use App\Models\CsatSurvey;
use App\Models\Ticket;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendCSATSurvey implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(public Ticket $ticket) {}

    public function handle(): void
    {
        $ticket = $this->ticket->loadMissing('requester');

        // Skip if a survey already exists for this ticket (idempotent)
        if (CsatSurvey::where('ticket_id', $ticket->id)->exists()) {
            return;
        }

        $survey = CsatSurvey::create([
            'ticket_id' => $ticket->id,
            'user_id'   => $ticket->requester_id,
            'email'     => $ticket->requester->email,
            'token'     => Str::random(64),
            'sent_at'   => now(),
        ]);

        Mail::to($survey->email)->send(new CsatSurveyMail($ticket, $survey));
    }
}
