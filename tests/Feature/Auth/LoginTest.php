<?php

declare(strict_types=1);

it('logs in a verified user with valid credentials', function () {
    $user = actingAsRole('client');

    $response = $this->post('/login', [
        'email'    => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('dashboard'));
    $this->assertAuthenticatedAs($user);
});

it('records a successful login in login_histories', function () {
    $user = actingAsRole('client');

    $this->post('/login', [
        'email'    => $user->email,
        'password' => 'password',
    ]);

    $this->assertDatabaseHas('login_histories', [
        'user_id' => $user->id,
        'email'   => $user->email,
        'status'  => 'success',
    ]);
});

it('updates last_login_at and last_login_ip on successful login', function () {
    $user = actingAsRole('client');

    expect($user->last_login_at)->toBeNull();

    $this->post('/login', [
        'email'    => $user->email,
        'password' => 'password',
    ]);

    $user->refresh();
    expect($user->last_login_at)->not->toBeNull();
    expect($user->last_login_ip)->not->toBeNull();
});

it('rejects login with wrong password', function () {
    $user = actingAsRole('client');

    $response = $this->post('/login', [
        'email'    => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('records a failed login attempt in login_histories', function () {
    $user = actingAsRole('client');

    $this->post('/login', [
        'email'    => $user->email,
        'password' => 'wrong',
    ]);

    $this->assertDatabaseHas('login_histories', [
        'user_id' => $user->id,
        'email'   => $user->email,
        'status'  => 'failed',
    ]);
});

it('rejects login for inactive accounts', function () {
    $user = actingAsRole('client', ['is_active' => false]);

    $response = $this->post('/login', [
        'email'    => $user->email,
        'password' => 'password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('redirects to 2FA challenge when 2FA is enabled', function () {
    $user = actingAsRole('client', [
        'two_factor_secret'       => 'JBSWY3DPEHPK3PXP',
        'two_factor_confirmed_at' => now(),
    ]);

    $response = $this->post('/login', [
        'email'    => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('two-factor.challenge'));
    $this->assertGuest();
    expect(session('two_factor_user_id'))->toBe($user->id);
});
