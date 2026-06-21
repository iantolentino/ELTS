<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasPermissionTo('users.view');
    }

    public function view(User $authUser, User $user): bool
    {
        return $authUser->hasPermissionTo('users.view');
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasPermissionTo('users.create');
    }

    public function update(User $authUser, User $user): bool
    {
        return $authUser->hasPermissionTo('users.edit');
    }
}
