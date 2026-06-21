<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateTeamRequest;
use App\Http\Requests\Admin\UpdateTeamRequest;
use App\Models\Department;
use App\Models\Team;
use App\Models\User;
use App\Services\TeamService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function __construct(
        private readonly TeamService $teamService,
    ) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', Team::class);

        $teams = $this->teamService->listTeams()->map(fn ($team) => [
            'id'            => $team->id,
            'name'          => $team->name,
            'description'   => $team->description,
            'department'    => $team->department?->name,
            'members_count' => $team->users_count,
            'is_active'     => $team->is_active,
        ]);

        return Inertia::render('Admin/Teams/Index', compact('teams'));
    }

    public function create(): Response
    {
        Gate::authorize('create', Team::class);

        return Inertia::render('Admin/Teams/Create', [
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(CreateTeamRequest $request): RedirectResponse
    {
        $team = $this->teamService->createTeam($request->validated());

        return redirect()->route('admin.teams.edit', $team)
            ->with('success', "Team \"{$team->name}\" created. Assign members below.");
    }

    public function edit(Team $team): Response
    {
        Gate::authorize('update', $team);

        $agents = User::role(['agent', 'supervisor'])
            ->with('team:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'job_title', 'team_id'])
            ->map(fn ($u) => [
                'id'           => $u->id,
                'name'         => $u->name,
                'email'        => $u->email,
                'job_title'    => $u->job_title,
                'current_team' => $u->team?->name,
            ]);

        return Inertia::render('Admin/Teams/Edit', [
            'team'        => [
                'id'            => $team->id,
                'name'          => $team->name,
                'description'   => $team->description,
                'department_id' => $team->department_id,
                'is_active'     => $team->is_active,
            ],
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'agents'      => $agents,
            'member_ids'  => $team->users()->pluck('id')->all(),
        ]);
    }

    public function update(UpdateTeamRequest $request, Team $team): RedirectResponse
    {
        $this->teamService->updateTeam($team, $request->validated());

        return back()->with('success', 'Team updated successfully.');
    }

    public function destroy(Team $team): RedirectResponse
    {
        Gate::authorize('delete', $team);

        $this->teamService->deleteTeam($team);

        return redirect()->route('admin.teams.index')
            ->with('success', "Team \"{$team->name}\" deleted.");
    }
}
