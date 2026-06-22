<?php

declare(strict_types=1);

use App\Jobs\ProcessIncomingEmail;
use App\Models\IncomingEmail;
use App\Models\Mailbox;
use App\Models\Ticket;
use App\Models\TicketStatus;
use Illuminate\Support\Facades\Queue;

beforeEach(fn () => seedRoles());

it('creates a new ticket from a pending incoming email', function () {
    Queue::fake();
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $email  = IncomingEmail::factory()->create([
        'from_email' => 'user@example.com',
        'from_name'  => 'Jane Doe',
        'subject'    => 'My laptop is broken',
        'body_text'  => 'Please help me fix it.',
        'status'     => 'pending',
    ]);

    (new ProcessIncomingEmail($email))->handle(app(\App\Services\TicketService::class));

    $email->refresh();
    expect($email->status)->toBe('processed')
        ->and($email->ticket_id)->not->toBeNull();

    $ticket = Ticket::find($email->ticket_id);
    expect($ticket->subject)->toBe('My laptop is broken')
        ->and($ticket->source)->toBe('email');
});

it('appends a reply when subject contains a ticket number', function () {
    Queue::fake();
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $agent  = actingAsRole('agent');
    $ticket = Ticket::factory()->withStatus($status)->create(['requester_id' => $agent->id]);

    $email = IncomingEmail::factory()->withReplySubject($ticket->ticket_number)->create([
        'body_text' => 'Here is more information.',
        'status'    => 'pending',
    ]);

    (new ProcessIncomingEmail($email))->handle(app(\App\Services\TicketService::class));

    $email->refresh();
    expect($email->status)->toBe('processed')
        ->and($email->ticket_id)->toBe($ticket->id);

    expect($ticket->replies()->count())->toBe(1);
});

it('marks email as failed when processing throws', function () {
    $email = IncomingEmail::factory()->create([
        'status'     => 'pending',
        'subject'    => null,
        'body_text'  => null,
        'body_html'  => null,
        'from_email' => 'bad@example.com',
    ]);

    // Force a failure by providing a broken TicketService mock
    $brokenService = Mockery::mock(\App\Services\TicketService::class);
    $brokenService->shouldReceive('createTicket')->andThrow(new \RuntimeException('DB error'));

    try {
        (new ProcessIncomingEmail($email))->handle($brokenService);
    } catch (\Throwable) {}

    $email->refresh();
    expect($email->status)->toBe('failed')
        ->and($email->failure_reason)->toContain('DB error');
});

it('skips already-processed emails', function () {
    Queue::fake();
    $email = IncomingEmail::factory()->processed()->create();

    $service = Mockery::mock(\App\Services\TicketService::class);
    $service->shouldNotReceive('createTicket');
    $service->shouldNotReceive('addReply');

    (new ProcessIncomingEmail($email))->handle($service);
});

it('finds or creates a user from the sender email', function () {
    Queue::fake();
    TicketStatus::factory()->create(['is_default' => true]);

    $email = IncomingEmail::factory()->create([
        'from_email' => 'newclient@example.com',
        'from_name'  => 'New Client',
        'status'     => 'pending',
    ]);

    (new ProcessIncomingEmail($email))->handle(app(\App\Services\TicketService::class));

    $user = \App\Models\User::where('email', 'newclient@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->name)->toBe('New Client')
        ->and($user->hasRole('client'))->toBeTrue();
});
