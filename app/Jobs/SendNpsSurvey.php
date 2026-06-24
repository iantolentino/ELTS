<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Mail\NpsSurveyMail;
use App\Models\NpsSurvey;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SendNpsSurvey implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(public readonly User $user) {}

    public function handle(): void
    {
        $frequencyDays = (int) config('ticketing.satisfaction.nps_frequency_days', 90);

        // Idempotent: skip if a recent survey was already sent for this user
        $alreadySent = NpsSurvey::where('user_id', $this->user->id)
            ->where('sent_at', '>=', now()->subDays($frequencyDays))
            ->exists();

        if ($alreadySent) {
            return;
        }

        $survey = NpsSurvey::create([
            'user_id'  => $this->user->id,
            'email'    => $this->user->email,
            'token'    => Str::random(64),
            'sent_at'  => now(),
        ]);

        Mail::to($this->user->email)->send(new NpsSurveyMail($survey));
    }
}
