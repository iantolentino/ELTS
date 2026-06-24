<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\NpsSurvey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NpsController extends Controller
{
    public function show(Request $request, string $token): Response
    {
        $survey = NpsSurvey::where('token', $token)->firstOrFail();

        $preScore = $request->integer('score');
        $preScore = ($preScore >= 0 && $preScore <= 10) ? $preScore : null;

        return Inertia::render('Nps/Show', [
            'survey'    => [
                'token'        => $survey->token,
                'score'        => $survey->score,
                'category'     => $survey->score !== null ? $survey->category() : null,
                'responded_at' => $survey->responded_at?->toIso8601String(),
                'is_expired'   => $survey->isExpired(),
            ],
            'pre_score' => $preScore,
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $survey = NpsSurvey::where('token', $token)->firstOrFail();

        if ($survey->hasResponded() || $survey->isExpired()) {
            return back();
        }

        $validated = $request->validate([
            'score'   => ['required', 'integer', 'min:0', 'max:10'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $survey->update([
            'score'        => $validated['score'],
            'comment'      => $validated['comment'] ?? null,
            'responded_at' => now(),
        ]);

        return redirect()->route('nps.show', $token)
            ->with('success', 'Thank you for your feedback!');
    }
}
