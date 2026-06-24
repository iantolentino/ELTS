<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\CsatSurvey;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CsatController extends Controller
{
    public function show(Request $request, string $token): Response
    {
        $survey = CsatSurvey::with('ticket:id,ticket_number,subject')
            ->where('token', $token)
            ->firstOrFail();

        $preScore = $request->integer('score');
        $preScore = ($preScore >= 1 && $preScore <= 5) ? $preScore : null;

        return Inertia::render('Csat/Show', [
            'survey'    => [
                'token'         => $survey->token,
                'ticket_number' => $survey->ticket->ticket_number,
                'ticket_subject'=> $survey->ticket->subject,
                'score'         => $survey->score,
                'responded_at'  => $survey->responded_at?->toIso8601String(),
                'is_expired'    => $survey->isExpired(),
            ],
            'pre_score' => $preScore,
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $survey = CsatSurvey::where('token', $token)->firstOrFail();

        if ($survey->hasResponded() || $survey->isExpired()) {
            return back();
        }

        $validated = $request->validate([
            'score'   => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $survey->update([
            'score'        => $validated['score'],
            'comment'      => $validated['comment'] ?? null,
            'responded_at' => now(),
        ]);

        return redirect()->route('csat.show', $token)
            ->with('success', 'Thank you for your feedback!');
    }
}
