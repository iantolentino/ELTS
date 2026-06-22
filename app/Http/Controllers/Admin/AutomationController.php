<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AutomationRule;
use App\Models\TicketCategory;
use App\Models\TicketStatus;
use App\Models\TicketTag;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AutomationController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', AutomationRule::class);

        return Inertia::render('Admin/Automations/Index', [
            'rules' => AutomationRule::withCount(['conditions', 'actions'])
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get()
                ->map(fn (AutomationRule $r) => [
                    'id'               => $r->id,
                    'name'             => $r->name,
                    'event'            => $r->event,
                    'match_type'       => $r->match_type,
                    'is_active'        => $r->is_active,
                    'sort_order'       => $r->sort_order,
                    'conditions_count' => $r->conditions_count,
                    'actions_count'    => $r->actions_count,
                ]),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', AutomationRule::class);

        return Inertia::render('Admin/Automations/Edit', $this->formOptions());
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', AutomationRule::class);

        $data = $this->validate($request);

        DB::transaction(function () use ($data) {
            $rule = AutomationRule::create([
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
                'event'       => $data['event'],
                'match_type'  => $data['match_type'],
                'is_active'   => $data['is_active'],
                'sort_order'  => $data['sort_order'] ?? 0,
            ]);

            $this->syncConditionsAndActions($rule, $data);
        });

        return redirect()->route('admin.automations.index')
            ->with('success', 'Automation rule created.');
    }

    public function edit(AutomationRule $automation): Response
    {
        Gate::authorize('update', $automation);

        $automation->load(['conditions', 'actions']);

        return Inertia::render('Admin/Automations/Edit', array_merge($this->formOptions(), [
            'rule' => [
                'id'          => $automation->id,
                'name'        => $automation->name,
                'description' => $automation->description,
                'event'       => $automation->event,
                'match_type'  => $automation->match_type,
                'is_active'   => $automation->is_active,
                'sort_order'  => $automation->sort_order,
                'conditions'  => $automation->conditions->map(fn ($c) => [
                    'field'    => $c->field,
                    'operator' => $c->operator,
                    'value'    => $c->value,
                ])->values(),
                'actions'     => $automation->actions->map(fn ($a) => [
                    'action_type' => $a->action_type,
                    'value'       => $a->value,
                ])->values(),
            ],
        ]));
    }

    public function update(Request $request, AutomationRule $automation): RedirectResponse
    {
        Gate::authorize('update', $automation);

        $data = $this->validate($request);

        DB::transaction(function () use ($automation, $data) {
            $automation->update([
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
                'event'       => $data['event'],
                'match_type'  => $data['match_type'],
                'is_active'   => $data['is_active'],
                'sort_order'  => $data['sort_order'] ?? 0,
            ]);

            $automation->conditions()->delete();
            $automation->actions()->delete();

            $this->syncConditionsAndActions($automation, $data);
        });

        return redirect()->route('admin.automations.index')
            ->with('success', 'Automation rule updated.');
    }

    public function destroy(AutomationRule $automation): RedirectResponse
    {
        Gate::authorize('delete', $automation);

        $automation->delete();

        return redirect()->route('admin.automations.index')
            ->with('success', 'Automation rule deleted.');
    }

    public function toggle(AutomationRule $automation): RedirectResponse
    {
        Gate::authorize('update', $automation);

        $automation->update(['is_active' => !$automation->is_active]);

        return back()->with('success', 'Rule ' . ($automation->is_active ? 'activated' : 'deactivated') . '.');
    }

    private function syncConditionsAndActions(AutomationRule $rule, array $data): void
    {
        foreach ($data['conditions'] as $i => $c) {
            $rule->conditions()->create([
                'field'      => $c['field'],
                'operator'   => $c['operator'],
                'value'      => $c['value'] ?? null,
                'sort_order' => $i,
            ]);
        }

        foreach ($data['actions'] as $i => $a) {
            $rule->actions()->create([
                'action_type' => $a['action_type'],
                'value'       => $a['value'] ?? null,
                'sort_order'  => $i,
            ]);
        }
    }

    private function validate(Request $request): array
    {
        return $request->validate([
            'name'                      => 'required|string|max:200',
            'description'               => 'nullable|string|max:1000',
            'event'                     => 'required|in:ticket_created,ticket_updated,ticket_replied,ticket_status_changed,ticket_assigned',
            'match_type'                => 'required|in:all,any',
            'is_active'                 => 'boolean',
            'sort_order'                => 'integer|min:0',
            'conditions'                => 'array',
            'conditions.*.field'        => 'required|string|max:60',
            'conditions.*.operator'     => 'required|string|max:30',
            'conditions.*.value'        => 'nullable|string|max:500',
            'actions'                   => 'required|array|min:1',
            'actions.*.action_type'     => 'required|string|max:60',
            'actions.*.value'           => 'nullable|string|max:500',
        ]);
    }

    private function formOptions(): array
    {
        return [
            'statuses'   => TicketStatus::orderBy('sort_order')->get(['id', 'name', 'is_closed']),
            'categories' => TicketCategory::orderBy('name')->get(['id', 'name']),
            'tags'       => TicketTag::orderBy('name')->get(['id', 'name']),
            'teams'      => Team::orderBy('name')->get(['id', 'name']),
            'agents'     => User::role(['agent', 'supervisor'])
                ->orderBy('name')
                ->get(['id', 'name']),
            'rule'       => null,
        ];
    }
}
