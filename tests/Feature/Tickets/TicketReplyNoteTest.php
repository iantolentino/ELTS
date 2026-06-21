<?php

declare(strict_types=1);

use App\Models\Ticket;
use App\Models\TicketNote;
use App\Models\TicketReply;
use App\Models\TicketStatus;

beforeEach(fn () => seedRoles());

it('allows a client to post a reply on their own ticket', function () {
    $client = actingAsRole('client');
    $ticket = Ticket::factory()->withStatus(TicketStatus::factory()->create())->withRequester($client)->create();

    $this->actingAs($client)
        ->post("/tickets/{$ticket->id}/replies", ['body' => '<p>Please help me.</p>'])
        ->assertRedirect();

    $this->assertDatabaseHas('ticket_replies', [
        'ticket_id' => $ticket->id,
        'user_id'   => $client->id,
    ]);
});

it('prevents a client from replying on another clients ticket', function () {
    $client1 = actingAsRole('client');
    $client2 = actingAsRole('client');
    $ticket  = Ticket::factory()->withStatus(TicketStatus::factory()->create())->withRequester($client2)->create();

    $this->actingAs($client1)
        ->post("/tickets/{$ticket->id}/replies", ['body' => '<p>Hello.</p>'])
        ->assertForbidden();
});

it('allows an agent to add an internal note', function () {
    $agent  = actingAsRole('agent');
    $ticket = Ticket::factory()->withStatus(TicketStatus::factory()->create())->create();

    $this->actingAs($agent)
        ->post("/tickets/{$ticket->id}/notes", ['body' => '<p>Internal only.</p>'])
        ->assertRedirect();

    $this->assertDatabaseHas('ticket_notes', [
        'ticket_id' => $ticket->id,
        'user_id'   => $agent->id,
    ]);
});

it('prevents a client from adding an internal note', function () {
    $client = actingAsRole('client');
    $ticket = Ticket::factory()->withStatus(TicketStatus::factory()->create())->withRequester($client)->create();

    $this->actingAs($client)
        ->post("/tickets/{$ticket->id}/notes", ['body' => '<p>Sneaky note.</p>'])
        ->assertForbidden();
});

it('records first_response_at when an agent first replies', function () {
    $agent  = actingAsRole('agent');
    $ticket = Ticket::factory()->withStatus(TicketStatus::factory()->create())->create();

    expect($ticket->first_response_at)->toBeNull();

    $this->actingAs($agent)
        ->post("/tickets/{$ticket->id}/replies", ['body' => '<p>On it!</p>']);

    expect($ticket->fresh()->first_response_at)->not->toBeNull();
});
