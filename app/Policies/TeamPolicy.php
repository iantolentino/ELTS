<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->hasPermissionTo('teams.view');
    }

    public function create(User $authUser): bool
    {
        return $authUser->hasPermissionTo('teams.create');
    }

    public function update(User $authUser, Team $team): bool
    {
        return $authUser->hasPermissionTo('teams.edit');
    }

    public function delete(User $authUser, Team $team): bool
    {
        return $authUser->hasPermissionTo('teams.delete');
    }
}
