<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactorChallengeRequest;
use App\Models\User;
use App\Services\AuthService;
use App\Services\TwoFactorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorChallengeController extends Controller
{
    public function __construct(
        private readonly TwoFactorService $twoFactorService,
        private readonly AuthService $authService,
    ) {}

    public function show(Request $request): Response|RedirectResponse
    {
        if (!$request->session()->has('two_factor_user_id')) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorChallenge');
    }

    public function store(TwoFactorChallengeRequest $request): RedirectResponse
    {
        $userId = $request->session()->get('two_factor_user_id');

        if (!$userId) {
            return redirect()->route('login');
        }

        /** @var User $user */
        $user = User::findOrFail($userId);

        if (!$this->twoFactorService->verifyCode($user, $request->string('code'))) {
            throw ValidationException::withMessages([
                'code' => 'The code is invalid. Please check your authenticator app and try again.',
            ]);
        }

        $remember = $request->session()->pull('two_factor_remember', false);
        $request->session()->forget('two_factor_user_id');

        Auth::login($user, $remember);
        $request->session()->regenerate();

        return redirect()->intended($this->authService->redirectPath($user));
    }
}
