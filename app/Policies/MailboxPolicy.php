<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class MailboxPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('settings.email');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('settings.email');
    }

    public function update(User $user): bool
    {
        return $user->hasPermissionTo('settings.email');
    }

    public function delete(User $user): bool
    {
        return $user->hasPermissionTo('settings.email');
    }
}
