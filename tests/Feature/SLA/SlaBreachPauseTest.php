<?php

declare(strict_types=1);

use App\Events\SLABreached;
use App\Jobs\CheckSLABreaches;
use App\Models\SlaPolicy;
use App\Models\SlaRecord;
use App\Models\Ticket;
use App\Models\TicketNote;
use App\Models\TicketStatus;
use App\Services\SLAService;
use Illuminate\Support\Facades\Event;

beforeEach(fn () => seedRoles());

/* ── Breach detection ─────────────────────────────────────────────────────── */

it('marks overdue first_response record as breached', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    SlaRecord::create([
        'ticket_id'               => $ticket->id,
        'sla_policy_id'           => $policy->id,
        'first_response_due'      => now()->subMinutes(10),
        'resolution_due'          => now()->addHours(4),
        'first_response_breached' => false,
        'resolution_breached'     => false,
        'paused_minutes'          => 0,
    ]);

    (new CheckSLABreaches())->handle();

    $record = SlaRecord::where('ticket_id', $ticket->id)->first();
    expect($record->first_response_breached)->toBeTrue()
        ->and($record->resolution_breached)->toBeFalse();
});

it('marks overdue resolution record as breached', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    SlaRecord::create([
        'ticket_id'               => $ticket->id,
        'sla_policy_id'           => $policy->id,
        'first_response_due'      => now()->subHours(2),
        'resolution_due'          => now()->subMinutes(5),
        'first_response_breached' => true,  // already marked
        'resolution_breached'     => false,
        'paused_minutes'          => 0,
    ]);

    (new CheckSLABreaches())->handle();

    $record = SlaRecord::where('ticket_id', $ticket->id)->first();
    expect($record->resolution_breached)->toBeTrue();
});

it('dispatches SLABreached event for each breached type', function () {
    Event::fake();
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    SlaRecord::create([
        'ticket_id'               => $ticket->id,
        'sla_policy_id'           => $policy->id,
        'first_response_due'      => now()->subMinutes(30),
        'resolution_due'          => now()->subMinutes(10),
        'first_response_breached' => false,
        'resolution_breached'     => false,
        'paused_minutes'          => 0,
    ]);

    (new CheckSLABreaches())->handle();

    Event::assertDispatched(SLABreached::class, fn ($e) => $e->type === 'first_response');
    Event::assertDispatched(SLABreached::class, fn ($e) => $e->type === 'resolution');
});

it('does not re-breach an already-breached record', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    SlaRecord::create([
        'ticket_id'               => $ticket->id,
        'sla_policy_id'           => $policy->id,
        'first_response_due'      => now()->subHours(2),
        'resolution_due'          => now()->subHour(),
        'first_response_breached' => true,  // already breached
        'resolution_breached'     => true,
        'paused_minutes'          => 0,
    ]);

    Event::fake();
    (new CheckSLABreaches())->handle();

    Event::assertNotDispatched(SLABreached::class);
});

it('does not breach an already-met record', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    SlaRecord::create([
        'ticket_id'               => $ticket->id,
        'sla_policy_id'           => $policy->id,
        'first_response_due'      => now()->subHours(1),
        'resolution_due'          => now()->subMinutes(30),
        'first_response_met_at'   => now()->subHours(2),   // met before due
        'resolution_met_at'       => now()->subHour(),
        'first_response_breached' => false,
        'resolution_breached'     => false,
        'paused_minutes'          => 0,
    ]);

    Event::fake();
    (new CheckSLABreaches())->handle();

    Event::assertNotDispatched(SLABreached::class);
});

/* ── Pause / Resume ───────────────────────────────────────────────────────── */

it('pause sets paused_at on the sla record', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    SlaRecord::create([
        'ticket_id'      => $ticket->id,
        'sla_policy_id'  => $policy->id,
        'first_response_due' => now()->addHours(4),
        'resolution_due'     => now()->addHours(8),
        'paused_minutes'     => 0,
    ]);
    $ticket->load('slaRecord');

    app(SLAService::class)->pause($ticket);

    $ticket->slaRecord->refresh();
    expect($ticket->slaRecord->isPaused())->toBeTrue()
        ->and($ticket->slaRecord->paused_at)->not->toBeNull();
});

it('pause is idempotent when already paused', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    $record = SlaRecord::create([
        'ticket_id'      => $ticket->id,
        'sla_policy_id'  => $policy->id,
        'first_response_due' => now()->addHours(4),
        'resolution_due'     => now()->addHours(8),
        'paused_at'          => now()->subMinutes(5),
        'paused_minutes'     => 0,
    ]);
    $ticket->load('slaRecord');
    $originalPausedAt = $record->paused_at;

    app(SLAService::class)->pause($ticket);

    $record->refresh();
    expect($record->paused_at->toIso8601String())->toBe($originalPausedAt->toIso8601String());
});

it('resume extends due times by the paused wall-clock minutes', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    $originalDue = now()->addHours(4);
    SlaRecord::create([
        'ticket_id'          => $ticket->id,
        'sla_policy_id'      => $policy->id,
        'first_response_due' => $originalDue,
        'resolution_due'     => now()->addHours(8),
        'paused_at'          => now()->subMinutes(30),
        'paused_minutes'     => 0,
    ]);
    $ticket->load('slaRecord');

    app(SLAService::class)->resume($ticket);

    $ticket->slaRecord->refresh();
    expect($ticket->slaRecord->isPaused())->toBeFalse()
        ->and($ticket->slaRecord->paused_minutes)->toBeGreaterThanOrEqual(29) // ~30 min
        ->and($ticket->slaRecord->first_response_due->gt($originalDue))->toBeTrue();
});

it('resume is a no-op when sla is not paused', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    $originalDue = now()->addHours(4);
    SlaRecord::create([
        'ticket_id'          => $ticket->id,
        'sla_policy_id'      => $policy->id,
        'first_response_due' => $originalDue,
        'resolution_due'     => now()->addHours(8),
        'paused_minutes'     => 0,
        // paused_at is null → not paused
    ]);
    $ticket->load('slaRecord');

    app(SLAService::class)->resume($ticket);

    $ticket->slaRecord->refresh();
    expect($ticket->slaRecord->paused_minutes)->toBe(0)
        ->and($ticket->slaRecord->first_response_due->format('Y-m-d H:i'))
        ->toBe($originalDue->format('Y-m-d H:i'));
});

/* ── Breach notification ──────────────────────────────────────────────────── */

it('sla breach listener adds an in-app note to the ticket', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $policy = SlaPolicy::factory()->create();
    $record = SlaRecord::create([
        'ticket_id'      => $ticket->id,
        'sla_policy_id'  => $policy->id,
        'first_response_due' => now()->subMinutes(10),
        'resolution_due'     => now()->addHours(4),
        'paused_minutes'     => 0,
    ]);

    event(new SLABreached($ticket, $record, 'first_response'));

    $note = TicketNote::where('ticket_id', $ticket->id)
        ->where('body', 'like', '%First-response SLA%')
        ->first();
    expect($note)->not->toBeNull()
        ->and($note->body)->toContain('First-response SLA');
});
