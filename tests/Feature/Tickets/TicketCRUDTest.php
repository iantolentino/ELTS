<?php

declare(strict_types=1);

use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\User;

beforeEach(fn () => seedRoles());

it('allows an agent to create a ticket via HTTP', function () {
    $agent  = actingAsRole('agent');
    $status = TicketStatus::factory()->default()->create();

    $response = $this->actingAs($agent)->post('/tickets', [
        'subject'     => 'Test hardware failure',
        'description' => '<p>Keyboard stopped working.</p>',
        'priority'    => 'high',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', ['subject' => 'Test hardware failure', 'requester_id' => $agent->id]);
});

it('auto-assigns the ticket number after creation', function () {
    $agent  = actingAsRole('agent');
    TicketStatus::factory()->default()->create();

    $this->actingAs($agent)->post('/tickets', [
        'subject'     => 'Number test',
        'description' => '<p>Check numbering.</p>',
        'priority'    => 'medium',
    ]);

    $ticket = Ticket::where('subject', 'Number test')->first();
    expect($ticket)->not->toBeNull();
    expect($ticket->ticket_number)->toMatch('/^TKT-\d{5}$/');
});

it('allows an agent to view their own ticket', function () {
    $agent  = actingAsRole('agent');
    $ticket = Ticket::factory()->withStatus(TicketStatus::factory()->create())->withRequester($agent)->create();

    $this->actingAs($agent)
        ->get("/tickets/{$ticket->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Tickets/Show'));
});

it('prevents a client from viewing another clients ticket', function () {
    $client1 = actingAsRole('client');
    $client2 = actingAsRole('client');
    $ticket  = Ticket::factory()->withStatus(TicketStatus::factory()->create())->withRequester($client2)->create();

    $this->actingAs($client1)
        ->get("/tickets/{$ticket->id}")
        ->assertForbidden();
});

it('allows an admin to delete a ticket', function () {
    $admin  = actingAsRole('admin');
    $ticket = Ticket::factory()->withStatus(TicketStatus::factory()->create())->create();

    $this->actingAs($admin)
        ->delete("/tickets/{$ticket->id}")
        ->assertRedirect('/tickets');

    $this->assertSoftDeleted('tickets', ['id' => $ticket->id]);
});

it('prevents a client from deleting a ticket', function () {
    $client = actingAsRole('client');
    $ticket = Ticket::factory()->withStatus(TicketStatus::factory()->create())->create();

    $this->actingAs($client)
        ->delete("/tickets/{$ticket->id}")
        ->assertForbidden();
});
