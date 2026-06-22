<?php

declare(strict_types=1);

use App\Models\AutomationAction;
use App\Models\AutomationCondition;
use App\Models\AutomationRule;
use App\Models\Ticket;
use App\Models\TicketNote;
use App\Models\TicketStatus;
use App\Models\TicketTag;
use App\Models\User;
use App\Services\AutomationService;

beforeEach(fn () => seedRoles());

/* ── Helper ────────────────────────────────────────────────────────────────── */

function makeRule(string $event, array $conditions = [], array $actions = []): AutomationRule
{
    $rule = AutomationRule::factory()->forEvent($event)->create();

    foreach ($conditions as $i => $c) {
        AutomationCondition::create([
            'automation_rule_id' => $rule->id,
            'field'              => $c['field'],
            'operator'           => $c['operator'],
            'value'              => $c['value'] ?? null,
            'sort_order'         => $i,
        ]);
    }

    foreach ($actions as $i => $a) {
        AutomationAction::create([
            'automation_rule_id' => $rule->id,
            'action_type'        => $a['action_type'],
            'value'              => $a['value'] ?? null,
            'sort_order'         => $i,
        ]);
    }

    return $rule->load(['conditions', 'actions']);
}

/* ── Condition matching ─────────────────────────────────────────────────────── */

it('evaluates equals condition on priority', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create(['priority' => 'critical']);
    $agent  = actingAsRole('agent');

    makeRule('ticket_created', [
        ['field' => 'priority', 'operator' => 'equals', 'value' => 'critical'],
    ], [
        ['action_type' => 'assign_to', 'value' => (string) $agent->id],
    ]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->assignee_id)->toBe($agent->id);
});

it('skips rule when condition does not match', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create(['priority' => 'low']);
    $agent  = actingAsRole('agent');

    makeRule('ticket_created', [
        ['field' => 'priority', 'operator' => 'equals', 'value' => 'critical'],
    ], [
        ['action_type' => 'assign_to', 'value' => (string) $agent->id],
    ]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->assignee_id)->toBeNull();
});

it('matches subject contains condition', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create(['subject' => 'URGENT: server down']);
    $agent  = actingAsRole('agent');

    makeRule('ticket_created', [
        ['field' => 'subject', 'operator' => 'contains', 'value' => 'urgent'],
    ], [
        ['action_type' => 'assign_to', 'value' => (string) $agent->id],
    ]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->assignee_id)->toBe($agent->id);
});

it('matches is_empty operator when field is null', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create(['assignee_id' => null]);
    $agent  = actingAsRole('agent');

    makeRule('ticket_created', [
        ['field' => 'assignee', 'operator' => 'is_empty'],
    ], [
        ['action_type' => 'assign_to', 'value' => (string) $agent->id],
    ]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->assignee_id)->toBe($agent->id);
});

it('matches any-condition match_type when at least one condition passes', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create(['priority' => 'low']);
    $agent  = actingAsRole('agent');

    $rule = AutomationRule::factory()->forEvent('ticket_created')->matchAny()->create();
    AutomationCondition::create(['automation_rule_id' => $rule->id, 'field' => 'priority', 'operator' => 'equals', 'value' => 'critical', 'sort_order' => 0]);
    AutomationCondition::create(['automation_rule_id' => $rule->id, 'field' => 'priority', 'operator' => 'equals', 'value' => 'low',      'sort_order' => 1]);
    AutomationAction::create(['automation_rule_id' => $rule->id, 'action_type' => 'assign_to', 'value' => (string) $agent->id, 'sort_order' => 0]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->assignee_id)->toBe($agent->id);
});

/* ── Action types ───────────────────────────────────────────────────────────── */

it('change_priority action updates ticket priority', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create(['priority' => 'low']);

    makeRule('ticket_created', [], [
        ['action_type' => 'change_priority', 'value' => 'critical'],
    ]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->priority)->toBe('critical');
});

it('change_status action updates ticket status', function () {
    $open   = TicketStatus::factory()->create(['is_default' => true, 'is_closed' => false]);
    $closed = TicketStatus::factory()->create(['is_closed' => true, 'name' => 'Closed']);
    $ticket = Ticket::factory()->withStatus($open)->create();

    makeRule('ticket_created', [], [
        ['action_type' => 'change_status', 'value' => (string) $closed->id],
    ]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->status_id)->toBe($closed->id);
});

it('add_tag action attaches a tag to the ticket', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();

    makeRule('ticket_created', [], [
        ['action_type' => 'add_tag', 'value' => 'billing'],
    ]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->tags->pluck('name')->toArray())->toContain('billing');
});

it('remove_tag action detaches a tag from the ticket', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();
    $tag    = TicketTag::firstOrCreate(['name' => 'billing'], ['color' => '#aaa']);
    $ticket->tags()->attach($tag->id);

    makeRule('ticket_created', [], [
        ['action_type' => 'remove_tag', 'value' => 'billing'],
    ]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->tags->pluck('name')->toArray())->not->toContain('billing');
});

it('add_note action creates an internal note', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create();

    makeRule('ticket_created', [], [
        ['action_type' => 'add_note', 'value' => 'Auto-triaged.'],
    ]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    $note = TicketNote::where('ticket_id', $ticket->id)
        ->where('body', 'like', '%Auto-triaged%')
        ->first();

    expect($note)->not->toBeNull();
});

it('close action sets ticket to closed status', function () {
    $open   = TicketStatus::factory()->create(['is_default' => true, 'is_closed' => false]);
    $closed = TicketStatus::factory()->create(['is_closed' => true, 'sort_order' => 1]);
    $ticket = Ticket::factory()->withStatus($open)->create();

    makeRule('ticket_created', [], [['action_type' => 'close']]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->closed_at)->not->toBeNull();
});

/* ── Round-robin assignment ─────────────────────────────────────────────────── */

it('assign_round_robin picks agent with fewest open tickets', function () {
    $open    = TicketStatus::factory()->create(['is_default' => true, 'is_closed' => false]);
    $agent1  = actingAsRole('agent', ['availability_status' => 'online']);
    $agent2  = actingAsRole('agent', ['availability_status' => 'online']);

    // agent1 has 2 open tickets, agent2 has 0 — expect agent2 gets this one
    Ticket::factory()->withStatus($open)->create(['assignee_id' => $agent1->id]);
    Ticket::factory()->withStatus($open)->create(['assignee_id' => $agent1->id]);

    $ticket = Ticket::factory()->withStatus($open)->create(['assignee_id' => null]);

    makeRule('ticket_created', [], [['action_type' => 'assign_round_robin']]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->assignee_id)->toBe($agent2->id);
});

/* ── Skill-based routing ────────────────────────────────────────────────────── */

it('assign_by_skill picks agent whose skills overlap ticket tags', function () {
    $open    = TicketStatus::factory()->create(['is_default' => true, 'is_closed' => false]);
    $billing = TicketTag::firstOrCreate(['name' => 'billing'], ['color' => '#aaa']);
    $network = TicketTag::firstOrCreate(['name' => 'network'], ['color' => '#bbb']);

    $billingAgent = actingAsRole('agent', ['availability_status' => 'online', 'skills' => ['billing', 'finance']]);
    $networkAgent = actingAsRole('agent', ['availability_status' => 'online', 'skills' => ['network']]);

    $ticket = Ticket::factory()->withStatus($open)->create(['assignee_id' => null]);
    $ticket->tags()->attach($billing->id);

    makeRule('ticket_created', [], [['action_type' => 'assign_by_skill']]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->assignee_id)->toBe($billingAgent->id);
});

/* ── Inactive rules are skipped ─────────────────────────────────────────────── */

it('skips inactive rules', function () {
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $ticket = Ticket::factory()->withStatus($status)->create(['priority' => 'low']);
    $agent  = actingAsRole('agent');

    $rule = AutomationRule::factory()->inactive()->forEvent('ticket_created')->create();
    AutomationAction::create(['automation_rule_id' => $rule->id, 'action_type' => 'assign_to', 'value' => (string) $agent->id, 'sort_order' => 0]);

    app(AutomationService::class)->evaluate($ticket->fresh(), 'ticket_created');

    expect($ticket->fresh()->assignee_id)->toBeNull();
});
