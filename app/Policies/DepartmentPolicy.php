<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Department;
use App\Models\User;

class DepartmentPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasPermissionTo('departments.view');
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasPermissionTo('departments.create');
    }

    public function update(User $authUser, Department $department): bool
    {
        return $authUser->hasPermissionTo('departments.edit');
    }

    public function delete(User $authUser, Department $department): bool
    {
        return $authUser->hasPermissionTo('departments.delete');
    }
}
