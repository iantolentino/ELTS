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
|   P11    — activitylog:clean        (daily — ACTIVE)
*/

app()->booted(function () {
    $schedule = app(Schedule::class);

    // Prune activity log entries older than ACTIVITY_LOGGER_RETENTION_DAYS (default 365 days)
    $schedule->command('activitylog:clean')->daily();

    // P3-04 — Poll all active IMAP mailboxes and queue processing jobs
    $schedule->command('mailboxes:poll')->everyTwoMinutes();

    // Placeholder — uncomment as each phase implements the corresponding job:
    // $schedule->job(new \App\Jobs\CheckSLABreaches)->everyFiveMinutes();
    // $schedule->command('tickets:auto-close')->daily();
    // $schedule->command('reports:generate-scheduled')->daily();
});
