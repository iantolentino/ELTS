<?php

declare(strict_types=1);

use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Events\TicketReplied;
use App\Events\TicketStatusChanged;
use App\Jobs\SendTicketEmail;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\TicketStatus;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

beforeEach(fn () => seedRoles());

it('dispatches SendTicketEmail when ticket is created', function () {
    Queue::fake();
    TicketStatus::factory()->create(['is_default' => true]);
    $agent = actingAsRole('agent');

    $this->actingAs($agent)->post('/tickets', [
        'subject'     => 'Test email dispatch',
        'description' => '<p>Hello</p>',
        'priority'    => 'medium',
    ])->assertRedirect();

    Queue::assertPushed(SendTicketEmail::class, fn ($job) => true);
});

it('dispatches SendTicketEmail when agent replies to ticket', function () {
    Queue::fake();
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $agent  = actingAsRole('agent');
    $client = actingAsRole('client');
    $ticket = Ticket::factory()->withStatus($status)->create(['requester_id' => $client->id]);

    $this->actingAs($agent)->post("/tickets/{$ticket->id}/replies", [
        'body' => '<p>We are on it!</p>',
    ])->assertRedirect();

    Queue::assertPushed(SendTicketEmail::class);
});

it('does not dispatch email when client replies to own ticket', function () {
    Queue::fake();
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $client = actingAsRole('client');
    $ticket = Ticket::factory()->withStatus($status)->create(['requester_id' => $client->id]);

    // Clear creation email
    Queue::fake();

    $this->actingAs($client)->post("/tickets/{$ticket->id}/replies", [
        'body' => '<p>Any update?</p>',
    ])->assertRedirect();

    // TicketReplied is fired but SendTicketEmail should not be dispatched for requester-to-self replies
    Queue::assertNotPushed(SendTicketEmail::class);
});

it('fires TicketStatusChanged event when status changes to closed', function () {
    Event::fake([TicketStatusChanged::class]);
    $openStatus   = TicketStatus::factory()->create(['is_default' => true]);
    $closedStatus = TicketStatus::factory()->closed()->create();
    $admin        = actingAsRole('admin');
    $ticket       = Ticket::factory()->withStatus($openStatus)->create();

    $this->actingAs($admin)->patch("/tickets/{$ticket->id}/status", [
        'status_id' => $closedStatus->id,
    ])->assertRedirect();

    Event::assertDispatched(TicketStatusChanged::class, fn ($e) => $e->isNowClosed === true);
});

it('fires TicketAssigned event and dispatches email to new assignee', function () {
    Queue::fake();
    $status = TicketStatus::factory()->create(['is_default' => true]);
    $admin  = actingAsRole('admin');
    $agent  = actingAsRole('agent');
    $ticket = Ticket::factory()->withStatus($status)->create(['assignee_id' => null]);

    $this->actingAs($admin)->patch("/tickets/{$ticket->id}/assign", [
        'assignee_id' => $agent->id,
    ])->assertRedirect();

    Queue::assertPushed(SendTicketEmail::class, fn ($job) => true);
});
