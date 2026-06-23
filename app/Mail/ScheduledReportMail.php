<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\ScheduledReport;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Attachment;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ScheduledReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ScheduledReport $report,
        public readonly Carbon          $from,
        public readonly Carbon          $to,
        private readonly string         $fileContent,
        private readonly string         $filename,
        private readonly string         $mimeType,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->report->name}] {$this->from->toDateString()} — {$this->to->toDateString()}",
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.scheduled-report');
    }

    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => $this->fileContent, $this->filename)
                ->withMime($this->mimeType),
        ];
    }
}
