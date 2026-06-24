<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\CsatSurvey;
use App\Models\Ticket;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CsatSurveyMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public Ticket     $ticket,
        public CsatSurvey $survey,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "How did we do? — Ticket #{$this->ticket->ticket_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.csat-survey',
        );
    }
}
