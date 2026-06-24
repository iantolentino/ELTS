<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class RetentionController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', Activity::class);

        return Inertia::render('Admin/Retention/Index', [
            'settings'      => $this->loadSettings(),
            'lastRun'       => $this->loadLastRun(),
            'activityCount' => DB::table('activity_log')->count(),
            'loginCount'    => DB::table('login_histories')->count(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('viewAny', Activity::class);

        $data = $request->validate([
            'activity_log_days'  => ['required', 'integer', 'min:1', 'max:3650'],
            'login_history_days' => ['required', 'integer', 'min:1', 'max:3650'],
        ]);

        Storage::disk('local')->put('retention_settings.json', json_encode($data));

        return back()->with('success', 'Retention settings saved.');
    }

    public function runNow(): RedirectResponse
    {
        Gate::authorize('viewAny', Activity::class);

        Artisan::call('logs:prune');

        return back()->with('success', 'Log prune completed successfully.');
    }

    private function loadSettings(): array
    {
        $defaults = [
            'activity_log_days'  => config('ticketing.retention.activity_log_days', 90),
            'login_history_days' => config('ticketing.retention.login_history_days', 180),
        ];

        if (Storage::disk('local')->exists('retention_settings.json')) {
            $saved = json_decode(Storage::disk('local')->get('retention_settings.json'), true);
            if (is_array($saved)) {
                return array_merge($defaults, $saved);
            }
        }

        return $defaults;
    }

    private function loadLastRun(): ?array
    {
        if (! Storage::disk('local')->exists('retention_last_run.json')) {
            return null;
        }

        $data = json_decode(Storage::disk('local')->get('retention_last_run.json'), true);

        return is_array($data) ? $data : null;
    }
}
