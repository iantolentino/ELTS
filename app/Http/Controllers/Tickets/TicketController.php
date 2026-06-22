<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tickets;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tickets\AssignTicketRequest;
use App\Http\Requests\Tickets\ChangePriorityRequest;
use App\Http\Requests\Tickets\ChangeStatusRequest;
use App\Http\Requests\Tickets\CreateTicketRequest;
use App\Http\Requests\Tickets\ListTicketsRequest;
use App\Models\CustomField;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketStatus;
use App\Models\Team;
use App\Models\TicketTag;
use App\Models\User;
use App\Services\TicketService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
    ) {}

    public function index(ListTicketsRequest $request): Response
    {
        $filters = $request->validated();

        /** @var User $actor */
        $actor   = $request->user();
        $tickets = $this->ticketService->listTickets($filters, $actor);

        return Inertia::render('Tickets/Index', [
            'tickets'    => $tickets->through(fn (Ticket $ticket) => [
                'id'            => $ticket->id,
                'ticket_number' => $ticket->ticket_number,
                'subject'       => $ticket->subject,
                'priority'      => $ticket->priority,
                'source'        => $ticket->source,
                'is_vip'        => $ticket->is_vip,
                'due_at'        => $ticket->due_at?->diffForHumans(),
                'created_at'    => $ticket->created_at->format('M d, Y'),
                'updated_at'    => $ticket->updated_at->diffForHumans(),
                'status'        => ['id' => $ticket->status->id, 'name' => $ticket->status->name, 'color' => $ticket->status->color, 'is_closed' => $ticket->status->is_closed],
                'category'      => $ticket->category ? ['id' => $ticket->category->id, 'name' => $ticket->category->name] : null,
                'requester'     => ['id' => $ticket->requester->id, 'name' => $ticket->requester->name, 'avatar_url' => $ticket->requester->avatar ? Storage::disk('public')->url($ticket->requester->avatar) : null],
                'assignee'      => $ticket->assignee ? ['id' => $ticket->assignee->id, 'name' => $ticket->assignee->name, 'avatar_url' => $ticket->assignee->avatar ? Storage::disk('public')->url($ticket->assignee->avatar) : null] : null,
                'team'          => $ticket->team ? ['id' => $ticket->team->id, 'name' => $ticket->team->name] : null,
                'tags'          => $ticket->tags->map(fn ($tag) => ['id' => $tag->id, 'name' => $tag->name, 'color' => $tag->color])->all(),
                'first_response_at' => $ticket->first_response_at?->diffForHumans(),
                'resolved_at'   => $ticket->resolved_at?->diffForHumans(),
                'closed_at'     => $ticket->closed_at?->diffForHumans(),
            ]),
            'filters'    => array_merge([
                'search' => '', 'status_id' => '', 'priority' => '', 'category_id' => '',
                'assignee_id' => '', 'team_id' => '', 'date_from' => '', 'date_to' => '',
                'sort_by' => 'created_at', 'sort_dir' => 'desc', 'per_page' => 20,
            ], array_filter($filters, fn ($v) => $v !== null && $v !== '')),
            'statuses'   => TicketStatus::orderBy('sort_order')->get(['id', 'name', 'color']),
            'categories' => TicketCategory::where('is_active', true)->orderBy('name')->get(['id', 'name', 'parent_id']),
            'agents'     => User::role(['super_admin', 'admin', 'supervisor', 'agent'])->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Ticket::class);

        return Inertia::render('Tickets/Create', [
            'statuses'      => TicketStatus::orderBy('sort_order')->get(['id', 'name', 'color', 'is_default']),
            'categories'    => TicketCategory::where('is_active', true)->orderBy('name')->get(['id', 'name', 'parent_id']),
            'agents'        => User::role(['super_admin', 'admin', 'supervisor', 'agent'])->orderBy('name')->get(['id', 'name']),
            'teams'         => Team::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'customFields'  => CustomField::where('is_active', true)->whereNull('category_id')->orderBy('sort_order')->get(['id', 'label', 'type', 'options', 'is_required']),
        ]);
    }

    public function store(CreateTicketRequest $request): RedirectResponse
    {
        /** @var User $actor */
        $actor  = $request->user();
        $ticket = $this->ticketService->createTicket($request->validated(), $actor);

        return redirect()->route('tickets.show', $ticket)
            ->with('success', 'Ticket ' . $ticket->ticket_number . ' created.');
    }

    public function show(Ticket $ticket): Response
    {
        Gate::authorize('view', $ticket);

        $ticket->load([
            'status', 'category', 'requester', 'assignee', 'team', 'tags',
            'parentTicket:id,ticket_number,subject',
            'childTickets:id,parent_ticket_id,ticket_number,subject',
            'replies.user', 'notes.user', 'watchers.user', 'customFieldValues.field',
            'attachments.user', 'slaRecord.policy',
        ]);

        /** @var User $user */
        $user = Auth::user();

        $activity = $ticket->activities()->latest()->take(30)->get()->map(fn ($a) => [
            'id'          => $a->id,
            'description' => $a->description,
            'causer'      => $a->causer ? ['name' => $a->causer->name] : null,
            'changes'     => $a->properties->get('attributes', []),
            'old'         => $a->properties->get('old', []),
            'created_at'  => $a->created_at->diffForHumans(),
        ])->all();

        $avatarUrl = fn (?User $u) => $u?->avatar ? Storage::disk('public')->url($u->avatar) : null;

        return Inertia::render('Tickets/Show', [
            'ticket'   => [
                'id'                => $ticket->id,
                'ticket_number'     => $ticket->ticket_number,
                'subject'           => $ticket->subject,
                'description'       => $ticket->description,
                'priority'          => $ticket->priority,
                'source'            => $ticket->source,
                'is_vip'            => $ticket->is_vip,
                'due_at'            => $ticket->due_at?->format('Y-m-d'),
                'first_response_at' => $ticket->first_response_at?->diffForHumans(),
                'resolved_at'       => $ticket->resolved_at?->diffForHumans(),
                'closed_at'         => $ticket->closed_at?->diffForHumans(),
                'created_at'        => $ticket->created_at->format('M d, Y g:i A'),
                'updated_at'        => $ticket->updated_at->diffForHumans(),
                'status'            => ['id' => $ticket->status->id, 'name' => $ticket->status->name, 'color' => $ticket->status->color, 'is_closed' => $ticket->status->is_closed],
                'category'          => $ticket->category ? ['id' => $ticket->category->id, 'name' => $ticket->category->name] : null,
                'requester'         => ['id' => $ticket->requester->id, 'name' => $ticket->requester->name, 'email' => $ticket->requester->email, 'avatar_url' => $avatarUrl($ticket->requester)],
                'assignee'          => $ticket->assignee ? ['id' => $ticket->assignee->id, 'name' => $ticket->assignee->name, 'avatar_url' => $avatarUrl($ticket->assignee)] : null,
                'team'              => $ticket->team ? ['id' => $ticket->team->id, 'name' => $ticket->team->name] : null,
                'tags'              => $ticket->tags->map(fn ($tag) => ['id' => $tag->id, 'name' => $tag->name, 'color' => $tag->color])->all(),
                'parent_ticket'     => $ticket->parentTicket ? ['id' => $ticket->parentTicket->id, 'ticket_number' => $ticket->parentTicket->ticket_number, 'subject' => $ticket->parentTicket->subject] : null,
                'child_tickets'     => $ticket->childTickets->map(fn ($c) => ['id' => $c->id, 'ticket_number' => $c->ticket_number, 'subject' => $c->subject])->all(),
                'attachments'       => $ticket->attachments->map(fn ($a) => ['id' => $a->id, 'filename' => $a->filename, 'mime_type' => $a->mime_type, 'size' => $a->size, 'user' => ['name' => $a->user?->name ?? 'Unknown'], 'created_at' => $a->created_at->format('M d, Y')])->all(),
                'watchers'          => $ticket->watchers->map(fn ($w) => ['id' => $w->user?->id, 'name' => $w->user?->name ?? 'Deleted User'])->filter(fn ($w) => $w['id'])->values()->all(),
                'is_watching'       => $ticket->watchers->contains('user_id', $user->id),
                'replies'           => $ticket->replies->map(fn ($r) => [
                    'id'         => $r->id,
                    'user'       => ['id' => $r->user?->id, 'name' => $r->user?->name ?? 'Deleted User', 'avatar_url' => $avatarUrl($r->user)],
                    'body'       => $r->body,
                    'is_html'    => $r->is_html,
                    'cc'         => $r->cc,
                    'created_at' => $r->created_at->format('M d, Y g:i A'),
                ])->all(),
                'notes'             => $ticket->notes->map(fn ($n) => [
                    'id'         => $n->id,
                    'user'       => ['id' => $n->user?->id, 'name' => $n->user?->name ?? 'Deleted User', 'avatar_url' => $avatarUrl($n->user)],
                    'body'       => $n->body,
                    'is_html'    => $n->is_html,
                    'created_at' => $n->created_at->format('M d, Y g:i A'),
                ])->all(),
                'activity'          => $activity,
                'sla'               => $ticket->slaRecord ? [
                    'status'                   => $ticket->slaRecord->resolutionStatus(),
                    'paused'                   => $ticket->slaRecord->isPaused(),
                    'policy_name'              => $ticket->slaRecord->policy?->name,
                    'first_response_due'       => $ticket->slaRecord->first_response_due?->toIso8601String(),
                    'first_response_due_diff'  => $ticket->slaRecord->first_response_due?->diffForHumans(),
                    'first_response_breached'  => $ticket->slaRecord->first_response_breached,
                    'first_response_met_at'    => $ticket->slaRecord->first_response_met_at?->diffForHumans(),
                    'resolution_due'           => $ticket->slaRecord->resolution_due?->toIso8601String(),
                    'resolution_due_diff'      => $ticket->slaRecord->resolution_due?->diffForHumans(),
                    'resolution_breached'      => $ticket->slaRecord->resolution_breached,
                    'resolution_met_at'        => $ticket->slaRecord->resolution_met_at?->diffForHumans(),
                ] : null,
                'custom_field_values' => $ticket->customFieldValues->map(fn ($cfv) => [
                    'field' => ['id' => $cfv->field->id, 'label' => $cfv->field->label, 'type' => $cfv->field->type],
                    'value' => $cfv->value,
                ])->all(),
            ],
            'can'      => [
                'reply'           => $user->can('reply', $ticket),
                'note_internal'   => $user->can('noteInternal', $ticket),
                'assign'          => $user->can('assign', Ticket::class),
                'change_status'   => $user->can('changeStatus', Ticket::class),
                'change_priority' => $user->can('changePriority', Ticket::class),
                'update'          => $user->can('update', $ticket),
                'watch'           => $user->can('watch', $ticket),
                'merge'           => $user->can('merge', Ticket::class),
                'delete'          => $user->can('delete', $ticket),
                'link'            => $user->can('update', $ticket),
                'attach'          => $user->can('update', $ticket),
            ],
            'statuses' => TicketStatus::orderBy('sort_order')->get(['id', 'name', 'color']),
            'agents'   => User::role(['super_admin', 'admin', 'supervisor', 'agent'])->orderBy('name')->get(['id', 'name']),
            'teams'    => Team::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'allTags'  => TicketTag::orderBy('name')->get(['id', 'name', 'color']),
        ]);
    }

    public function changeStatus(ChangeStatusRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->ticketService->changeStatus($ticket, (int) $request->validated('status_id'));

        return back()->with('success', 'Status updated.');
    }

    public function changePriority(ChangePriorityRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->ticketService->changePriority($ticket, (string) $request->validated('priority'));

        return back()->with('success', 'Priority updated.');
    }

    public function assign(AssignTicketRequest $request, Ticket $ticket): RedirectResponse
    {
        $validated = $request->validated();
        $this->ticketService->assign(
            $ticket,
            isset($validated['assignee_id']) ? ($validated['assignee_id'] ? (int) $validated['assignee_id'] : null) : $ticket->assignee_id,
            isset($validated['team_id']) ? ($validated['team_id'] ? (int) $validated['team_id'] : null) : $ticket->team_id,
        );

        return back()->with('success', 'Assignment updated.');
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        Gate::authorize('delete', $ticket);
        $this->ticketService->deleteTicket($ticket);

        return redirect()->route('tickets.index')->with('success', 'Ticket deleted.');
    }
}
