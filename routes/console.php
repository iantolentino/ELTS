<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| ELTS Scheduled Tasks
|--------------------------------------------------------------------------
| All recurring jobs are registered here. The cPanel cron fires this file
| every minute via: php artisan schedule:run
|
| Tasks added per phase:
|   P3-04  — ProcessIncomingEmail     (every 2 minutes)
|   P4-04  — CheckSLABreaches         (every 5 minutes)
|   P5-09  — auto-close stale tickets (daily)
|   P7-13  — GenerateScheduledReport  (daily / custom)
|   P11-06 — logs:prune               (daily — replaces activitylog:clean)
*/

app()->booted(function () {
    $schedule = app(Schedule::class);

    // P11-06 — Prune activity_log + login_histories using admin-configured retention days
    // Replaces the built-in activitylog:clean (which used a fixed env var and didn't cover login_histories)
    $schedule->command('logs:prune')->daily();

    // P3-04 — Poll all active IMAP mailboxes and queue processing jobs
    $schedule->command('mailboxes:poll')->everyTwoMinutes();

    // P4-04 — Check for SLA breaches and fire SLABreached event
    $schedule->job(new \App\Jobs\CheckSLABreaches)->everyFiveMinutes();

    // P5-09 — Auto-close stale tickets (no activity for 30 days by default)
    $schedule->command('tickets:auto-close')->daily();

    // P7-13 — Dispatch GenerateScheduledReport jobs for any reports due at this minute
    $schedule->command('reports:dispatch-scheduled')->everyMinute();

    // P9-04 — Dispatch NPS survey jobs for eligible clients (frequency-gated, 100 users/run)
    $schedule->command('surveys:send-nps')->daily();
});
