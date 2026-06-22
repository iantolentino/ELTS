<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\EmailTemplate;
use App\Models\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Ticket $ticket,
        public string $event,
        public array  $extra = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->resolveSubject());
    }

    public function content(): Content
    {
        $custom = EmailTemplate::where('event_name', $this->event)
            ->where('is_active', true)
            ->first();

        if ($custom?->body) {
            return new Content(
                htmlString: $this->interpolate($custom->body),
            );
        }

        return new Content(
            view: "emails.tickets.{$this->event}",
            with: [
                'ticket' => $this->ticket,
                'extra'  => $this->extra,
            ],
        );
    }

    private function resolveSubject(): string
    {
        $custom = EmailTemplate::where('event_name', $this->event)
            ->where('is_active', true)
            ->value('subject');

        if ($custom) {
            return $this->interpolate($custom);
        }

        $number = $this->ticket->ticket_number;

        return match ($this->event) {
            'ticket_created'  => "[{$number}] Your support ticket has been received",
            'reply_received'  => "Re: [{$number}] {$this->ticket->subject}",
            'ticket_resolved' => "[{$number}] Your ticket has been resolved",
            'ticket_closed'   => "[{$number}] Your ticket has been closed",
            'ticket_assigned' => "[{$number}] Ticket assigned to you: {$this->ticket->subject}",
            default           => "[{$number}] Ticket update",
        };
    }

    private function interpolate(string $template): string
    {
        $ticket = $this->ticket;

        return str_replace(
            [
                '{{ticket_number}}',
                '{{ticket_subject}}',
                '{{requester_name}}',
                '{{requester_email}}',
                '{{assignee_name}}',
                '{{priority}}',
                '{{status}}',
                '{{ticket_url}}',
                '{{app_name}}',
                '{{reply_body}}',
            ],
            [
                $ticket->ticket_number,
                $ticket->subject,
                $ticket->requester?->name ?? '',
                $ticket->requester?->email ?? '',
                $ticket->assignee?->name ?? '',
                ucfirst($ticket->priority),
                $ticket->status?->name ?? '',
                config('app.url') . '/tickets/' . $ticket->id,
                config('app.name'),
                $this->extra['reply_body'] ?? '',
            ],
            $template
        );
    }
}
