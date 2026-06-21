<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;

beforeEach(fn () => seedRoles());

it('registers a new client user and logs them in', function () {
    $response = $this->post('/register', [
        'name'                  => 'John Client',
        'email'                 => 'john@example.com',
        'password'              => 'Password1',
        'password_confirmation' => 'Password1',
    ]);

    $response->assertRedirect();
    $this->assertAuthenticated();

    $user = User::where('email', 'john@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasRole('client'))->toBeTrue();
});

it('fires the Registered event to trigger email verification', function () {
    Event::fake([Registered::class]);

    $this->post('/register', [
        'name'                  => 'Jane Client',
        'email'                 => 'jane@example.com',
        'password'              => 'Password1',
        'password_confirmation' => 'Password1',
    ]);

    Event::assertDispatched(Registered::class);
});

it('rejects registration with a duplicate email', function () {
    User::factory()->create(['email' => 'existing@example.com']);

    $response = $this->post('/register', [
        'name'                  => 'Another Person',
        'email'                 => 'existing@example.com',
        'password'              => 'Password1',
        'password_confirmation' => 'Password1',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('rejects registration with a weak password', function () {
    $response = $this->post('/register', [
        'name'                  => 'Weak Password',
        'email'                 => 'weak@example.com',
        'password'              => 'abc',
        'password_confirmation' => 'abc',
    ]);

    $response->assertSessionHasErrors('password');
    $this->assertGuest();
});

it('rejects registration with mismatched password confirmation', function () {
    $response = $this->post('/register', [
        'name'                  => 'Mismatch',
        'email'                 => 'mismatch@example.com',
        'password'              => 'Password1',
        'password_confirmation' => 'Different1',
    ]);

    $response->assertSessionHasErrors('password');
    $this->assertGuest();
});

it('redirects to login when registration is disabled via config', function () {
    config(['ticketing.portal.registration_enabled' => false]);

    $response = $this->get('/register');

    $response->assertRedirect(route('login'));
});
