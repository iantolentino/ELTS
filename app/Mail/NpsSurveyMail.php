<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\NpsSurvey;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NpsSurveyMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly NpsSurvey $survey) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'How likely are you to recommend us? (Quick question)',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.nps-survey',
        );
    }
}
