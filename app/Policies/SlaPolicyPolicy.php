<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class SlaPolicyPolicy
{
    public function viewAny(User $user): bool  { return $user->hasPermissionTo('sla.view'); }
    public function create(User $user): bool   { return $user->hasPermissionTo('sla.manage'); }
    public function update(User $user): bool   { return $user->hasPermissionTo('sla.manage'); }
    public function delete(User $user): bool   { return $user->hasPermissionTo('sla.manage'); }
}
