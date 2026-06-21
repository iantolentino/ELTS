<?php

declare(strict_types=1);

use App\Models\Ticket;
use App\Models\TicketStatus;

beforeEach(fn () => seedRoles());

it('allows an admin to bulk-close tickets', function () {
    $admin   = actingAsRole('admin');
    TicketStatus::factory()->closed()->create();
    $status  = TicketStatus::factory()->create();
    $tickets = Ticket::factory()->count(3)->withStatus($status)->create();

    $this->actingAs($admin)->post('/tickets/bulk', [
        'ticket_ids' => $tickets->pluck('id')->all(),
        'action'     => 'close',
    ])->assertRedirect();

    foreach ($tickets as $ticket) {
        expect(Ticket::find($ticket->id)->closed_at)->not->toBeNull();
    }
});

it('allows an admin to bulk-assign tickets', function () {
    $admin   = actingAsRole('admin');
    $agent   = actingAsRole('agent');
    $status  = TicketStatus::factory()->create();
    $tickets = Ticket::factory()->count(2)->withStatus($status)->create();

    $this->actingAs($admin)->post('/tickets/bulk', [
        'ticket_ids'  => $tickets->pluck('id')->all(),
        'action'      => 'assign',
        'assignee_id' => $agent->id,
    ])->assertRedirect();

    foreach ($tickets as $ticket) {
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'assignee_id' => $agent->id]);
    }
});

it('allows an admin to bulk-delete tickets', function () {
    $admin   = actingAsRole('admin');
    $status  = TicketStatus::factory()->create();
    $tickets = Ticket::factory()->count(2)->withStatus($status)->create();

    $this->actingAs($admin)->post('/tickets/bulk', [
        'ticket_ids' => $tickets->pluck('id')->all(),
        'action'     => 'delete',
    ])->assertRedirect();

    foreach ($tickets as $ticket) {
        $this->assertSoftDeleted('tickets', ['id' => $ticket->id]);
    }
});

it('prevents a client from bulk-deleting tickets', function () {
    $client  = actingAsRole('client');
    $status  = TicketStatus::factory()->create();
    $tickets = Ticket::factory()->count(2)->withStatus($status)->create();

    $this->actingAs($client)->post('/tickets/bulk', [
        'ticket_ids' => $tickets->pluck('id')->all(),
        'action'     => 'delete',
    ])->assertForbidden();
});

it('allows an admin to bulk-change ticket status', function () {
    $admin      = actingAsRole('admin');
    $statusFrom = TicketStatus::factory()->create();
    $statusTo   = TicketStatus::factory()->create();
    $tickets    = Ticket::factory()->count(2)->withStatus($statusFrom)->create();

    $this->actingAs($admin)->post('/tickets/bulk', [
        'ticket_ids' => $tickets->pluck('id')->all(),
        'action'     => 'change_status',
        'status_id'  => $statusTo->id,
    ])->assertRedirect();

    foreach ($tickets as $ticket) {
        $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'status_id' => $statusTo->id]);
    }
});
