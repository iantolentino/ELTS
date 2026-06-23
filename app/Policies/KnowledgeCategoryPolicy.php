<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\KnowledgeCategory;
use App\Models\User;

class KnowledgeCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin', 'supervisor']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin']);
    }

    public function update(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin']);
    }

    public function delete(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin']);
    }
}
