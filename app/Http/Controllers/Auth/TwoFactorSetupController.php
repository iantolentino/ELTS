<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\EnableTwoFactorRequest;
use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorSetupController extends Controller
{
    public function __construct(private readonly TwoFactorService $twoFactorService) {}

    public function show(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $isEnabled = !is_null($user->two_factor_confirmed_at);

        if (!$isEnabled) {
            $this->twoFactorService->initiate($user);
            $user->refresh();
        }

        return Inertia::render('Auth/TwoFactorSetup', [
            'isEnabled' => $isEnabled,
            'qrCodeSvg' => $isEnabled ? null : $this->twoFactorService->getQrCodeDataUri($user),
            'secretKey' => $isEnabled ? null : $user->two_factor_secret,
        ]);
    }

    public function enable(EnableTwoFactorRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$this->twoFactorService->verifyCode($user, (string) $request->input('code'))) {
            throw ValidationException::withMessages([
                'code' => 'The code is invalid. Please check your authenticator app and try again.',
            ]);
        }

        $this->twoFactorService->enable($user);

        return redirect()->route('two-factor.setup')
            ->with('status', 'Two-factor authentication has been enabled successfully.');
    }

    public function disable(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'current_password'],
        ]);

        /** @var User $user */
        $user = Auth::user();

        $this->twoFactorService->disable($user);

        return redirect()->route('two-factor.setup')
            ->with('status', 'Two-factor authentication has been disabled.');
    }
}
