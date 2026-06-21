<?php

declare(strict_types=1);

namespace App\Services;

use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleService
{
    public function syncPermissions(Role $role, array $permissionNames): void
    {
        $role->syncPermissions($permissionNames);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
