<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\UserService;
use Illuminate\Support\Facades\Hash;

beforeEach(fn () => seedRoles());

it('returns a paginated list of all users', function () {
    actingAsRole('client');
    actingAsRole('client');
    actingAsRole('client');

    $result = app(UserService::class)->listUsers([]);

    expect($result->total())->toBe(3);
});

it('filters users by name search term', function () {
    actingAsRole('client', ['name' => 'Alice Smith']);
    actingAsRole('client', ['name' => 'Bob Jones']);

    $result = app(UserService::class)->listUsers(['search' => 'Alice']);

    expect($result->total())->toBe(1);
    expect($result->items()[0]->name)->toBe('Alice Smith');
});

it('filters users by email search term', function () {
    actingAsRole('client', ['email' => 'find-me@example.com']);
    actingAsRole('client');

    $result = app(UserService::class)->listUsers(['search' => 'find-me']);

    expect($result->total())->toBe(1);
});

it('filters users by role', function () {
    actingAsRole('client');
    actingAsRole('client');
    actingAsRole('agent');

    $result = app(UserService::class)->listUsers(['role' => 'agent']);

    expect($result->total())->toBe(1);
    expect($result->items()[0]->roles->first()->name)->toBe('agent');
});

it('filters users by active status', function () {
    actingAsRole('client', ['is_active' => true]);
    actingAsRole('client', ['is_active' => false]);

    $result = app(UserService::class)->listUsers(['status' => 'inactive']);

    expect($result->total())->toBe(1);
    expect($result->items()[0]->is_active)->toBeFalsy();
});

it('creates a user, hashes the password, and assigns the specified role', function () {
    $user = app(UserService::class)->createUser([
        'name'     => 'New Agent',
        'email'    => 'newagent@example.com',
        'password' => 'Password1',
        'role'     => 'agent',
    ]);

    expect($user->hasRole('agent'))->toBeTrue();
    expect(Hash::check('Password1', $user->password))->toBeTrue();
    $this->assertDatabaseHas('users', ['email' => 'newagent@example.com']);
});

it('updates a user without changing the password when left blank', function () {
    $user         = actingAsRole('client');
    $originalHash = $user->password;

    app(UserService::class)->updateUser($user, [
        'name'     => 'Updated Name',
        'email'    => $user->email,
        'password' => '',
    ]);

    $user->refresh();
    expect($user->name)->toBe('Updated Name');
    expect($user->password)->toBe($originalHash);
});

it('hashes and applies a new password when provided', function () {
    $user         = actingAsRole('client');
    $originalHash = $user->password;

    app(UserService::class)->updateUser($user, [
        'name'     => $user->name,
        'email'    => $user->email,
        'password' => 'NewPassword1',
    ]);

    $user->refresh();
    expect($user->password)->not->toBe($originalHash);
    expect(Hash::check('NewPassword1', $user->password))->toBeTrue();
});

it('syncs the role when updated', function () {
    $user = actingAsRole('agent');

    app(UserService::class)->updateUser($user, [
        'name'  => $user->name,
        'email' => $user->email,
        'role'  => 'supervisor',
    ]);

    $user->refresh();
    expect($user->hasRole('supervisor'))->toBeTrue();
    expect($user->hasRole('agent'))->toBeFalse();
});

it('updates the availability status independently', function () {
    $user = actingAsRole('agent');

    app(UserService::class)->updateAvailability($user, 'busy');

    $user->refresh();
    expect($user->availability_status)->toBe('busy');
});
