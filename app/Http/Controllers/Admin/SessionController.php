<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
        abort_unless($request->user()->hasPermissionTo('audit.view'), 403);

        $filters = $request->only(['search', 'per_page']);
        $current = $request->session()->getId();

        $sessions = $this->sessionService->paginateAll($filters);

        return Inertia::render('Admin/Sessions/Index', [
            'sessions'   => $sessions->through(fn ($s) => [
                'id'            => $s->id,
                'user_id'       => $s->user_id,
                'user_name'     => $s->user_name,
                'user_email'    => $s->user_email,
                'ip_address'    => $s->ip_address,
                'user_agent'    => $s->user_agent,
                'last_activity' => $s->last_activity,
                'is_current'    => $s->id === $current,
            ]),
            'filters'    => $filters,
            'current_id' => $current,
        ]);
    }

    public function destroy(Request $request, string $sessionId): RedirectResponse
    {
        abort_unless($request->user()->hasPermissionTo('audit.view'), 403);

        if ($sessionId === $request->session()->getId()) {
            return back()->with('error', 'You cannot force-logout your own current session.');
        }

        $this->sessionService->revokeById($sessionId);

        return back()->with('success', 'Session terminated.');
    }
}
