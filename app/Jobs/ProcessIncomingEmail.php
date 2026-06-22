<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\IncomingEmail;
use App\Models\Ticket;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Throwable;

class ProcessIncomingEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public IncomingEmail $email) {}

    public function handle(TicketService $ticketService): void
    {
        if ($this->email->status !== 'pending') {
            return;
        }

        try {
            $ticket = $this->resolveTicket($ticketService);

            $this->email->update([
                'ticket_id'    => $ticket->id,
                'status'       => 'processed',
                'processed_at' => now(),
            ]);
        } catch (Throwable $e) {
            $this->email->update([
                'status'         => 'failed',
                'failure_reason' => Str::limit($e->getMessage(), 500),
                'processed_at'   => now(),
            ]);

            throw $e; // allow queue to retry up to $tries
        }
    }

    public function failed(Throwable $e): void
    {
        // Final failure after all retries exhausted — ensure status is marked failed
        $this->email->update([
            'status'         => 'failed',
            'failure_reason' => Str::limit($e->getMessage(), 500),
            'processed_at'   => now(),
        ]);
    }

    private function resolveTicket(TicketService $ticketService): Ticket
    {
        $ticketNumber = $this->extractTicketNumber($this->email->subject ?? '');

        $existingTicket = $ticketNumber
            ? Ticket::where('ticket_number', $ticketNumber)
                    ->whereNull('deleted_at')
                    ->whereNull('merged_into_id')
                    ->first()
            : null;

        $user = $this->findOrCreateUser();

        if ($existingTicket) {
            $ticketService->addReply($existingTicket, [
                'body' => $this->buildBody(),
                'cc'   => $this->email->to_email,
            ], $user);

            return $existingTicket;
        }

        return $ticketService->createTicket([
            'subject'     => $this->email->subject ?: '(No Subject)',
            'description' => $this->buildBody(),
            'source'      => 'email',
        ], $user);
    }

    private function buildBody(): string
    {
        if ($this->email->body_html) {
            return $this->email->body_html;
        }

        return nl2br(e($this->email->body_text ?? '(Empty message)'));
    }

    private function extractTicketNumber(string $subject): ?string
    {
        if (preg_match('/\b(TKT-\d+)\b/i', $subject, $matches)) {
            return strtoupper($matches[1]);
        }

        return null;
    }

    private function findOrCreateUser(): User
    {
        $fromEmail = $this->email->from_email;
        $fromName  = $this->email->from_name ?: Str::before($fromEmail, '@');

        $user = User::firstOrCreate(
            ['email' => $fromEmail],
            [
                'name'      => $fromName,
                'password'  => Hash::make(Str::random(32)),
                'is_active' => true,
            ]
        );

        if (!$user->hasAnyRole(['super_admin', 'admin', 'supervisor', 'agent', 'client'])) {
            $user->assignRole('client');
        }

        return $user;
    }
}
