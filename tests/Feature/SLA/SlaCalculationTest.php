<?php

declare(strict_types=1);

use App\Models\SlaPolicy;
use App\Models\SlaRecord;
use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Services\SLAService;
use Carbon\Carbon;

beforeEach(fn () => seedRoles());

it('creates sla record with calendar due times when policy uses calendar hours', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $policy = SlaPolicy::factory()->forPriority('medium')->create([
        'first_response_minutes' => 60,
        'resolution_minutes'     => 240,
        'uses_business_hours'    => false,
    ]);

    $ticket = Ticket::factory()->withStatus($status)->create([
        'priority'   => 'medium',
        'created_at' => Carbon::create(2026, 1, 5, 9, 0, 0, 'UTC'),
    ]);

    $record = app(SLAService::class)->createRecord($ticket);

    expect($record)->toBeInstanceOf(SlaRecord::class)
        ->and($record->sla_policy_id)->toBe($policy->id)
        ->and($record->first_response_due->format('Y-m-d H:i'))->toBe('2026-01-05 10:00')
        ->and($record->resolution_due->format('Y-m-d H:i'))->toBe('2026-01-05 13:00');
});

it('falls back to catch-all policy when no priority-specific policy matches', function () {
    $status  = TicketStatus::factory()->create(['is_default' => true]);
    $catchAll = SlaPolicy::factory()->create([   // null priority = catch-all
        'first_response_minutes' => 120,
        'resolution_minutes'     => 480,
        'uses_business_hours'    => false,
    ]);

    $ticket = Ticket::factory()->withStatus($status)->create(['priority' => 'high']);

    $record = app(SLAService::class)->createRecord($ticket);

    expect($record->sla_policy_id)->toBe($catchAll->id);
});

it('creates no sla record when no active policy exists', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    SlaPolicy::factory()->inactive()->create(); // inactive — should not match
    $ticket = Ticket::factory()->withStatus($status)->create(['priority' => 'low']);

    $record = app(SLAService::class)->createRecord($ticket);

    expect($record->sla_policy_id)->toBeNull()
        ->and($record->first_response_due)->toBeNull()
        ->and($record->resolution_due)->toBeNull();
});

it('respects business hours when calculating due time across day boundary', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    SlaPolicy::factory()->forPriority('high')->businessHours()->create([
        'first_response_minutes' => 60,   // 30 min Friday + 30 min Monday
        'resolution_minutes'     => 120,  // 30 min Friday + 90 min Monday
    ]);

    // Friday 2026-01-09 16:30 UTC — 30 min before close (default hours: 09:00–17:00)
    $ticket = Ticket::factory()->withStatus($status)->create([
        'priority'   => 'high',
        'created_at' => Carbon::create(2026, 1, 9, 16, 30, 0, 'UTC'),
    ]);

    $record = app(SLAService::class)->createRecord($ticket);

    // first_response: 30 min left Friday + 30 min Monday = Mon 09:30
    expect($record->first_response_due->format('Y-m-d H:i'))->toBe('2026-01-12 09:30');
    // resolution: 30 min left Friday + 90 min Monday = Mon 10:30
    expect($record->resolution_due->format('Y-m-d H:i'))->toBe('2026-01-12 10:30');
});

it('starts business clock at open time when ticket arrives outside business hours', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    SlaPolicy::factory()->forPriority('critical')->businessHours()->create([
        'first_response_minutes' => 30,
    ]);

    // Saturday 2026-01-10 — outside business hours, next open is Monday 09:00
    $ticket = Ticket::factory()->withStatus($status)->create([
        'priority'   => 'critical',
        'created_at' => Carbon::create(2026, 1, 10, 12, 0, 0, 'UTC'),
    ]);

    $record = app(SLAService::class)->createRecord($ticket);

    // Clock starts Monday 09:00, 30 min → 09:30
    expect($record->first_response_due->format('Y-m-d H:i'))->toBe('2026-01-12 09:30');
});

it('marks first response met and not breached when within sla', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $policy = SlaPolicy::factory()->create([
        'first_response_minutes' => 60,
        'resolution_minutes'     => 120,
        'uses_business_hours'    => false,
    ]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    SlaRecord::create([
        'ticket_id'          => $ticket->id,
        'sla_policy_id'      => $policy->id,
        'first_response_due' => now()->addMinutes(30),
        'resolution_due'     => now()->addHours(2),
        'paused_minutes'     => 0,
    ]);
    $ticket->load('slaRecord');

    app(SLAService::class)->checkFirstResponseMet($ticket);

    $ticket->slaRecord->refresh();
    expect($ticket->slaRecord->first_response_met_at)->not->toBeNull()
        ->and($ticket->slaRecord->first_response_breached)->toBeFalse();
});

it('marks first response breached when overdue', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $policy = SlaPolicy::factory()->create([
        'first_response_minutes' => 60,
        'resolution_minutes'     => 120,
        'uses_business_hours'    => false,
    ]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    SlaRecord::create([
        'ticket_id'          => $ticket->id,
        'sla_policy_id'      => $policy->id,
        'first_response_due' => now()->subMinutes(5),  // already overdue
        'resolution_due'     => now()->addHours(2),
        'paused_minutes'     => 0,
    ]);
    $ticket->load('slaRecord');

    app(SLAService::class)->checkFirstResponseMet($ticket);

    $ticket->slaRecord->refresh();
    expect($ticket->slaRecord->first_response_breached)->toBeTrue()
        ->and($ticket->slaRecord->first_response_met_at)->not->toBeNull();
});
