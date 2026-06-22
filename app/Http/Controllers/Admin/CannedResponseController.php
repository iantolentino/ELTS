<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CannedResponse;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CannedResponseController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', CannedResponse::class);

        $user = Auth::user();
        $isAdmin = $user->hasAnyRole(['super_admin', 'admin', 'supervisor']);

        $responses = CannedResponse::with(['user:id,name', 'team:id,name'])
            ->when(!$isAdmin, function ($q) use ($user) {
                // Agents only see global, their team, and their personal
                $q->where(function ($q2) use ($user) {
                    $q2->where('scope', 'global')
                        ->orWhere(function ($q3) use ($user) {
                            $q3->where('scope', 'team')->where('team_id', $user->team_id);
                        })
                        ->orWhere(function ($q3) use ($user) {
                            $q3->where('scope', 'personal')->where('user_id', $user->id);
                        });
                });
            })
            ->orderBy('scope')
            ->orderBy('title')
            ->get()
            ->map(fn (CannedResponse $cr) => [
                'id'        => $cr->id,
                'title'     => $cr->title,
                'body'      => $cr->body,
                'scope'     => $cr->scope,
                'is_active' => $cr->is_active,
                'user'      => $cr->user ? ['id' => $cr->user->id, 'name' => $cr->user->name] : null,
                'team'      => $cr->team ? ['id' => $cr->team->id, 'name' => $cr->team->name] : null,
                'can_edit'  => Gate::allows('update', $cr),
                'can_delete'=> Gate::allows('delete', $cr),
            ]);

        return Inertia::render('Admin/CannedResponses/Index', [
            'responses' => $responses,
            'teams'     => Team::orderBy('name')->get(['id', 'name']),
            'is_admin'  => $isAdmin,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', CannedResponse::class);

        $user    = Auth::user();
        $isAdmin = $user->hasAnyRole(['super_admin', 'admin', 'supervisor']);

        $validated = $request->validate([
            'title'   => 'required|string|max:200',
            'body'    => 'required|string',
            'scope'   => 'required|in:global,team,personal',
            'team_id' => 'nullable|exists:teams,id',
        ]);

        // Agents can only create personal responses
        if (!$isAdmin) {
            $validated['scope'] = 'personal';
        }

        CannedResponse::create([
            'title'   => $validated['title'],
            'body'    => $validated['body'],
            'scope'   => $validated['scope'],
            'user_id' => $validated['scope'] === 'personal' ? $user->id : null,
            'team_id' => $validated['scope'] === 'team'     ? ($validated['team_id'] ?? null) : null,
        ]);

        return back()->with('success', 'Canned response created.');
    }

    public function update(Request $request, CannedResponse $cannedResponse): RedirectResponse
    {
        Gate::authorize('update', $cannedResponse);

        $user    = Auth::user();
        $isAdmin = $user->hasAnyRole(['super_admin', 'admin', 'supervisor']);

        $validated = $request->validate([
            'title'   => 'required|string|max:200',
            'body'    => 'required|string',
            'scope'   => 'required|in:global,team,personal',
            'team_id' => 'nullable|exists:teams,id',
        ]);

        if (!$isAdmin) {
            $validated['scope'] = 'personal';
        }

        $cannedResponse->update([
            'title'   => $validated['title'],
            'body'    => $validated['body'],
            'scope'   => $validated['scope'],
            'user_id' => $validated['scope'] === 'personal' ? $user->id : null,
            'team_id' => $validated['scope'] === 'team'     ? ($validated['team_id'] ?? null) : null,
        ]);

        return back()->with('success', 'Canned response updated.');
    }

    public function destroy(CannedResponse $cannedResponse): RedirectResponse
    {
        Gate::authorize('delete', $cannedResponse);

        $cannedResponse->delete();

        return back()->with('success', 'Canned response deleted.');
    }
}
