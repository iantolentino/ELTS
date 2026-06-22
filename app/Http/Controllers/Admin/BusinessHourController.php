<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessHour;
use App\Models\SlaPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class BusinessHourController extends Controller
{
    private const DEFAULT_DAY = ['is_open' => false, 'open_time' => '09:00', 'close_time' => '17:00', 'timezone' => 'UTC'];

    public function index(): Response
    {
        Gate::authorize('manage', SlaPolicy::class);

        $policies = SlaPolicy::orderBy('name')->get(['id', 'name', 'priority']);
        $rows     = BusinessHour::all()->groupBy(fn ($r) => $r->sla_policy_id ?? 'global');

        $build = fn ($collection) => collect(range(0, 6))->mapWithKeys(function (int $day) use ($collection) {
            $row = $collection->firstWhere('day_of_week', $day);
            return [$day => $row ? [
                'is_open'    => $row->is_open,
                'open_time'  => $row->open_time  ?? '09:00',
                'close_time' => $row->close_time ?? '17:00',
                'timezone'   => $row->timezone   ?? 'UTC',
            ] : array_merge(self::DEFAULT_DAY, ['is_open' => $day >= 1 && $day <= 5])];
        })->all();

        $schedules = ['global' => $build($rows->get('global', collect()))];
        foreach ($policies as $p) {
            $schedules[$p->id] = $build($rows->get($p->id, collect()));
        }

        return Inertia::render('Admin/BusinessHours/Index', [
            'policies'  => $policies,
            'schedules' => $schedules,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('manage', SlaPolicy::class);

        $data = $request->validate([
            'policy_id'              => ['nullable', 'integer', 'exists:sla_policies,id'],
            'days'                   => ['required', 'array', 'size:7'],
            'days.*.day_of_week'     => ['required', 'integer', 'between:0,6'],
            'days.*.is_open'         => ['boolean'],
            'days.*.open_time'       => ['required', 'date_format:H:i'],
            'days.*.close_time'      => ['required', 'date_format:H:i'],
            'days.*.timezone'        => ['required', 'string', 'max:64'],
        ]);

        $policyId = $data['policy_id'] ?? null;

        foreach ($data['days'] as $day) {
            BusinessHour::updateOrCreate(
                ['sla_policy_id' => $policyId, 'day_of_week' => $day['day_of_week']],
                [
                    'is_open'    => $day['is_open']    ?? false,
                    'open_time'  => $day['open_time'],
                    'close_time' => $day['close_time'],
                    'timezone'   => $day['timezone'],
                ],
            );
        }

        $label = $policyId ? 'Policy business hours saved.' : 'Global business hours saved.';

        return back()->with('success', $label);
    }
}
