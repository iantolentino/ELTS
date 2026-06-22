<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\SlaPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('manage', SlaPolicy::class);

        $policies = SlaPolicy::orderBy('name')->get(['id', 'name', 'priority']);

        $grouped = Holiday::orderBy('date')
            ->get()
            ->groupBy(fn (Holiday $h) => $h->sla_policy_id ?? 'global')
            ->map(fn ($coll) => $coll->map(fn (Holiday $h) => [
                'id'               => $h->id,
                'name'             => $h->name,
                'date'             => $h->date->format('Y-m-d'),
                'date_label'       => $h->date->format('M d, Y'),
                'recurring_yearly' => $h->recurring_yearly,
            ])->values()->all());

        $holidays = ['global' => $grouped->get('global', [])];
        foreach ($policies as $p) {
            $holidays[$p->id] = $grouped->get($p->id, []);
        }

        return Inertia::render('Admin/Holidays/Index', [
            'policies' => $policies,
            'holidays' => $holidays,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('manage', SlaPolicy::class);

        $data = $request->validate([
            'policy_id'        => ['nullable', 'integer', 'exists:sla_policies,id'],
            'name'             => ['required', 'string', 'max:100'],
            'date'             => ['required', 'date_format:Y-m-d'],
            'recurring_yearly' => ['boolean'],
        ]);

        Holiday::create([
            'sla_policy_id'    => $data['policy_id'] ?? null,
            'name'             => $data['name'],
            'date'             => $data['date'],
            'recurring_yearly' => $data['recurring_yearly'] ?? false,
        ]);

        return back()->with('success', 'Holiday added.');
    }

    public function destroy(Holiday $holiday): RedirectResponse
    {
        Gate::authorize('manage', SlaPolicy::class);

        $holiday->delete();

        return back()->with('success', 'Holiday removed.');
    }
}
