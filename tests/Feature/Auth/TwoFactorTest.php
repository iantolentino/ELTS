<?php

declare(strict_types=1);

use PragmaRX\Google2FA\Google2FA;

it('generates a 2FA secret when visiting the setup page without one', function () {
    $user = actingAsRole('client');
    $this->actingAs($user);

    expect($user->two_factor_secret)->toBeNull();

    $this->get('/user/two-factor-setup');

    $user->refresh();
    expect($user->two_factor_secret)->not->toBeNull();
});

it('enables 2FA after verifying a valid TOTP code', function () {
    $secret = app(Google2FA::class)->generateSecretKey();
    $user   = actingAsRole('client', ['two_factor_secret' => $secret]);
    $this->actingAs($user);

    $code = app(Google2FA::class)->getCurrentOtp($secret);

    $this->post('/user/two-factor-setup', ['code' => $code])
         ->assertRedirect(route('two-factor.setup'));

    $user->refresh();
    expect($user->two_factor_confirmed_at)->not->toBeNull();
});

it('rejects an invalid TOTP code on setup', function () {
    $user = actingAsRole('client', [
        'two_factor_secret' => app(Google2FA::class)->generateSecretKey(),
    ]);
    $this->actingAs($user);

    $this->post('/user/two-factor-setup', ['code' => '000000'])
         ->assertSessionHasErrors('code');

    $user->refresh();
    expect($user->two_factor_confirmed_at)->toBeNull();
});

it('disables 2FA when the correct password is confirmed', function () {
    $user = actingAsRole('client', [
        'two_factor_secret'       => 'JBSWY3DPEHPK3PXP',
        'two_factor_confirmed_at' => now(),
    ]);
    $this->actingAs($user);

    $this->delete('/user/two-factor-setup', ['password' => 'password'])
         ->assertRedirect(route('two-factor.setup'));

    $user->refresh();
    expect($user->two_factor_secret)->toBeNull();
    expect($user->two_factor_confirmed_at)->toBeNull();
});

it('rejects 2FA disable with wrong password', function () {
    $user = actingAsRole('client', [
        'two_factor_secret'       => 'JBSWY3DPEHPK3PXP',
        'two_factor_confirmed_at' => now(),
    ]);
    $this->actingAs($user);

    $this->delete('/user/two-factor-setup', ['password' => 'wrong-password'])
         ->assertSessionHasErrors('password');

    $user->refresh();
    expect($user->two_factor_confirmed_at)->not->toBeNull();
});

it('completes login via 2FA challenge with a valid code', function () {
    $secret = 'JBSWY3DPEHPK3PXP';
    $user   = actingAsRole('client', [
        'two_factor_secret'       => $secret,
        'two_factor_confirmed_at' => now(),
    ]);

    // Step 1: login intercepts at 2FA — user is logged out, session stores pending ID
    $this->post('/login', ['email' => $user->email, 'password' => 'password']);
    $this->assertGuest();

    // Step 2: submit valid TOTP code
    $code = app(Google2FA::class)->getCurrentOtp($secret);

    $this->post('/two-factor-challenge', ['code' => $code])
         ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

it('rejects an invalid code on the 2FA challenge page', function () {
    $user = actingAsRole('client', [
        'two_factor_secret'       => 'JBSWY3DPEHPK3PXP',
        'two_factor_confirmed_at' => now(),
    ]);

    $this->post('/login', ['email' => $user->email, 'password' => 'password']);
    $this->assertGuest();

    $this->post('/two-factor-challenge', ['code' => '000000'])
         ->assertSessionHasErrors('code');

    $this->assertGuest();
});
