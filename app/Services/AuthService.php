<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(private readonly LoginHistoryService $loginHistory) {}

    public function attempt(LoginRequest $request): User
    {
        $email     = $request->string('email')->toString();
        $ip        = $request->ip();
        $userAgent = $request->userAgent();

        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            $lockoutSeconds = config('ticketing.security.lockout_minutes', 15) * 60;
            RateLimiter::hit($request->throttleKey(), $lockoutSeconds);

            $userId = User::where('email', $email)->value('id');
            $this->loginHistory->record($email, $ip, $userAgent, $userId, 'failed');

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if (!$user->is_active) {
            Auth::logout();
            $this->loginHistory->record($email, $ip, $userAgent, $user->id, 'failed');
            throw ValidationException::withMessages([
                'email' => __('Your account has been deactivated. Please contact support.'),
            ]);
        }

        RateLimiter::clear($request->throttleKey());

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);

        $this->loginHistory->record($email, $ip, $userAgent, $user->id, 'success');

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

    /**
     * Register a new client user, assign the client role, fire Registered event,
     * and log them in. The Registered event triggers the verification email.
     */
    public function register(RegisterRequest $request): User
    {
        $user = User::create([
            'name'     => $request->string('name'),
            'email'    => $request->string('email'),
            'password' => $request->string('password'),
        ]);

        $user->assignRole('client');

        event(new Registered($user));

        Auth::login($user);

        return $user;
    }

    public function logout(Request $request): void
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
