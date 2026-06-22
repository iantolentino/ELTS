<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\CannedResponse;
use App\Models\User;

class CannedResponsePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin', 'supervisor', 'agent']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin', 'supervisor', 'agent']);
    }

    public function update(User $user, CannedResponse $cr): bool
    {
        if ($cr->scope === 'personal') {
            return $cr->user_id === $user->id;
        }

        return $user->hasAnyRole(['super_admin', 'admin', 'supervisor']);
    }

    public function delete(User $user, CannedResponse $cr): bool
    {
        if ($cr->scope === 'personal') {
            return $cr->user_id === $user->id;
        }

        return $user->hasAnyRole(['super_admin', 'admin', 'supervisor']);
    }
}
