<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\KnowledgeArticle;
use App\Models\User;

class KnowledgeArticlePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin', 'supervisor', 'agent']);
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin', 'supervisor']);
    }

    public function update(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin', 'supervisor']);
    }

    public function delete(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin']);
    }
}
