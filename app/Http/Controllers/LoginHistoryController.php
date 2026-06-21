<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\LoginHistoryService;
use Inertia\Inertia;
use Inertia\Response;

class LoginHistoryController extends Controller
{
    public function __construct(private readonly LoginHistoryService $loginHistoryService) {}

    public function index(): Response
    {
        $entries = $this->loginHistoryService->forUser(auth()->user(), 50);

        return Inertia::render('Profile/LoginHistory', [
            'entries' => $entries->map(fn ($e) => [
                'id'         => $e->id,
                'ip_address' => $e->ip_address,
                'user_agent' => $e->user_agent,
                'status'     => $e->status,
                'created_at' => $e->created_at->toISOString(),
            ]),
        ]);
    }
}
