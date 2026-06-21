<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorService
{
    public function __construct(private readonly Google2FA $google2fa) {}

    public function initiate(User $user): void
    {
        if (!$user->two_factor_secret) {
            $user->update(['two_factor_secret' => $this->google2fa->generateSecretKey()]);
        }
    }

    public function getQrCodeDataUri(User $user): string
    {
        $url = $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $user->two_factor_secret,
        );

        $svg = (new Writer(
            new ImageRenderer(new RendererStyle(300), new SvgImageBackEnd())
        ))->writeString($url);

        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    public function verifyCode(User $user, string $code): bool
    {
        return (bool) $this->google2fa->verifyKey($user->two_factor_secret, $code);
    }

    public function enable(User $user): void
    {
        $user->update(['two_factor_confirmed_at' => now()]);
    }

    public function disable(User $user): void
    {
        $user->update([
            'two_factor_secret'       => null,
            'two_factor_confirmed_at' => null,
        ]);
    }
}
