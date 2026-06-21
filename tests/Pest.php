<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class)->in('Feature');

/*
|--------------------------------------------------------------------------
| Global setup
|--------------------------------------------------------------------------
*/

beforeEach(function () {
    app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
});

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Create a user with the given role. Creates the role via firstOrCreate so
 * tests do not need to run the full seeder just to get a single role.
 */
function actingAsRole(string $role, array $attributes = []): \App\Models\User
{
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
    $user = \App\Models\User::factory()->create($attributes);
    $user->assignRole($role);
    return $user;
}

/**
 * Seed all roles and permissions (runs RolesAndPermissionsSeeder).
 * Use this when a test needs the full permission matrix.
 */
function seedRoles(): void
{
    (new \Database\Seeders\RolesAndPermissionsSeeder())->run();
    app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
}
