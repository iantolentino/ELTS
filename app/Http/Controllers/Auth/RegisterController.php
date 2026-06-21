<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function show(): Response|RedirectResponse
    {
        if (!config('ticketing.portal.registration_enabled')) {
            return redirect()->route('login')->with('status', 'Self-registration is currently disabled. Please contact support.');
        }

        return Inertia::render('Auth/Register');
    }

    public function store(RegisterRequest $request): RedirectResponse
    {
        if (!config('ticketing.portal.registration_enabled')) {
            return redirect()->route('login');
        }

        $this->authService->register($request);

        return redirect()->route('verification.notice');
    }
}
