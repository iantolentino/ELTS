<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\SendNpsSurvey;
use App\Models\NpsSurvey;
use App\Models\User;
use Illuminate\Console\Command;

class SendNpsSurveys extends Command
{
    protected $signature   = 'surveys:send-nps {--limit=100 : Max users to process per run}';
    protected $description = 'Dispatch NPS survey jobs for eligible users (frequency-gated)';

    public function handle(): int
    {
        $frequencyDays = (int) config('ticketing.satisfaction.nps_frequency_days', 90);
        $limit         = (int) $this->option('limit');

        // Find client users who either never received an NPS or whose last one is older than frequency window
        $recentTokens = NpsSurvey::where('sent_at', '>=', now()->subDays($frequencyDays))
            ->whereNotNull('user_id')
            ->pluck('user_id');

        $users = User::role('client')
            ->where('is_active', true)
            ->whereNotIn('id', $recentTokens)
            ->limit($limit)
            ->get();

        $dispatched = 0;

        foreach ($users as $user) {
            SendNpsSurvey::dispatch($user);
            $dispatched++;
        }

        $this->info("Dispatched {$dispatched} NPS survey job(s).");

        return self::SUCCESS;
    }
}
