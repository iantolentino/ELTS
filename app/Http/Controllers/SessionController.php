<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\SessionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SessionController extends Controller
{
    public function __construct(private readonly SessionService $sessionService) {}

    public function index(Request $request): Response
    {
        $user    = $request->user();
        $current = $request->session()->getId();

        $sessions = $this->sessionService->getForUser($user)->map(fn ($s) => [
            'id'            => $s->id,
            'ip_address'    => $s->ip_address,
            'user_agent'    => $s->user_agent,
            'last_activity' => $s->last_activity,
            'is_current'    => $s->id === $current,
        ]);

        return Inertia::render('Profile/Sessions', [
            'sessions'   => $sessions,
            'current_id' => $current,
        ]);
    }

    public function destroy(Request $request, string $sessionId): RedirectResponse
    {
        $user    = $request->user();
        $current = $request->session()->getId();

        if ($sessionId === $current) {
            return back()->with('error', 'Use the sign-out button to end your current session.');
        }

        $this->sessionService->revokeSession($user, $sessionId);

        return back()->with('success', 'Session revoked.');
    }

    public function destroyOthers(Request $request): RedirectResponse
    {
        $user    = $request->user();
        $current = $request->session()->getId();

        $count = $this->sessionService->revokeOtherSessions($user, $current);

        return back()->with('success', "Revoked {$count} other session(s).");
    }
}
