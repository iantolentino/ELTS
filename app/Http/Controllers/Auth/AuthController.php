<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\AuthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
        ]);
    }

    public function login(LoginRequest $request): RedirectResponse
    {
        $request->ensureIsNotRateLimited();

        $user = $this->authService->attempt($request);

        $request->session()->regenerate();

        if ($user->two_factor_confirmed_at) {
            Auth::logout();
            $request->session()->put('two_factor_user_id', $user->id);
            $request->session()->put('two_factor_remember', $request->boolean('remember'));
            return redirect()->route('two-factor.challenge');
        }

        return redirect()->intended($this->authService->redirectPath($user));
    }

    public function logout(Request $request): RedirectResponse
    {
        $this->authService->logout($request);

        return redirect()->route('login');
    }
}
