<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ScheduledReport;
use App\Models\User;

class ScheduledReportPolicy
{
    private function isAdmin(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin']);
    }

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'admin', 'supervisor']);
    }

    public function create(User $user): bool  { return $this->isAdmin($user); }
    public function update(User $user, ScheduledReport $report): bool { return $this->isAdmin($user); }
    public function delete(User $user, ScheduledReport $report): bool { return $this->isAdmin($user); }
}
