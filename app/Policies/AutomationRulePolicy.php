<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class AutomationRulePolicy
{
    public function viewAny(User $user): bool { return $user->hasPermissionTo('automation.view'); }
    public function create(User $user): bool  { return $user->hasPermissionTo('automation.manage'); }
    public function update(User $user): bool  { return $user->hasPermissionTo('automation.manage'); }
    public function delete(User $user): bool  { return $user->hasPermissionTo('automation.manage'); }
}
