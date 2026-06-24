<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PruneLogs extends Command
{
    protected $signature = 'logs:prune
                            {--dry-run : Count rows that would be deleted without deleting them}';

    protected $description = 'Delete old activity_log and login_histories records based on admin retention settings';

    public function handle(): int
    {
        $settings = $this->loadSettings();

        $activityDays = max(1, (int) $settings['activity_log_days']);
        $loginDays    = max(1, (int) $settings['login_history_days']);
        $dryRun       = (bool) $this->option('dry-run');

        $activityCutoff = now()->subDays($activityDays);
        $loginCutoff    = now()->subDays($loginDays);

        $activityCount = DB::table('activity_log')
            ->where('created_at', '<', $activityCutoff)
            ->count();

        $loginCount = DB::table('login_histories')
            ->where('created_at', '<', $loginCutoff)
            ->count();

        if ($dryRun) {
            $this->info("[Dry run] activity_log: {$activityCount} row(s) older than {$activityDays} days");
            $this->info("[Dry run] login_histories: {$loginCount} row(s) older than {$loginDays} days");
            return self::SUCCESS;
        }

        DB::table('activity_log')
            ->where('created_at', '<', $activityCutoff)
            ->delete();

        DB::table('login_histories')
            ->where('created_at', '<', $loginCutoff)
            ->delete();

        Storage::disk('local')->put('retention_last_run.json', json_encode([
            'ran_at'          => now()->toIso8601String(),
            'activity_pruned' => $activityCount,
            'login_pruned'    => $loginCount,
            'activity_days'   => $activityDays,
            'login_days'      => $loginDays,
        ]));

        $this->info("Pruned {$activityCount} activity_log row(s) older than {$activityDays} days.");
        $this->info("Pruned {$loginCount} login_histories row(s) older than {$loginDays} days.");

        return self::SUCCESS;
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
}
