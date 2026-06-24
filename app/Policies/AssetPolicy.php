<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Asset;
use App\Models\User;

class AssetPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('assets.view');
    }

    public function view(User $user, Asset $asset): bool
    {
        return $user->hasPermissionTo('assets.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('assets.create');
    }

    public function update(User $user, Asset $asset): bool
    {
        return $user->hasPermissionTo('assets.edit');
    }

    public function delete(User $user, Asset $asset): bool
    {
        return $user->hasPermissionTo('assets.delete');
    }

    public function assign(User $user, Asset $asset): bool
    {
        return $user->hasPermissionTo('assets.assign');
    }
}
