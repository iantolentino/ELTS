<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Attempt login. Throws ValidationException on failure.
     * Updates last_login_at and last_login_ip on success.
     */
    public function attempt(LoginRequest $request): User
    {
        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            $lockoutSeconds = config('ticketing.security.lockout_minutes', 15) * 60;
            RateLimiter::hit($request->throttleKey(), $lockoutSeconds);

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (!$user->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => __('Your account has been deactivated. Please contact support.'),
            ]);
        }

        RateLimiter::clear($request->throttleKey());

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        return $user;
    }

    /**
     * Returns the post-login redirect path for the given user.
     * Phase 15 will differentiate clients → /portal.
     */
    public function redirectPath(User $user): string
    {
        return route('dashboard');
    }

    public function logout(Request $request): void
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
