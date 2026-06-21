<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
| Feature tests use the full Laravel TestCase with RefreshDatabase so every
| test starts with a clean slate. Unit tests use the lightweight PHPUnit
| TestCase and do not touch the database.
*/

uses(TestCase::class, RefreshDatabase::class)->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
| Extend Pest's expect() with project-specific helpers here.
| Example: expect()->extend('toBeValidTicket', fn () => ...);
*/

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
| Global helpers available in every test file.
*/

function actingAsRole(string $role): \Illuminate\Contracts\Auth\Authenticatable
{
    $user = \App\Models\User::factory()->create();
    $user->assignRole($role);
    return $user;
}
