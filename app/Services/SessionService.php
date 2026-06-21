<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class SessionService
{
    public function getForUser(User $user): Collection
    {
        return DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderByDesc('last_activity')
            ->get();
    }

    public function revokeSession(User $user, string $sessionId): bool
    {
        return DB::table('sessions')
            ->where('id', $sessionId)
            ->where('user_id', $user->id)
            ->delete() > 0;
    }

    public function revokeOtherSessions(User $user, string $currentSessionId): int
    {
        return DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', '!=', $currentSessionId)
            ->delete();
    }

    public function paginateAll(array $filters): LengthAwarePaginator
    {
        $search  = $filters['search']   ?? null;
        $perPage = in_array((int) ($filters['per_page'] ?? 25), [10, 25, 50, 100], true)
            ? (int) $filters['per_page']
            : 25;

        return DB::table('sessions')
            ->leftJoin('users', 'users.id', '=', 'sessions.user_id')
            ->select(
                'sessions.id',
                'sessions.user_id',
                'sessions.ip_address',
                'sessions.user_agent',
                'sessions.last_activity',
                'users.name as user_name',
                'users.email as user_email',
            )
            ->whereNotNull('sessions.user_id')
            ->orderByDesc('sessions.last_activity')
            ->when($search, fn ($q) =>
                $q->where(fn ($q2) =>
                    $q2->where('users.email', 'like', "%{$search}%")
                       ->orWhere('users.name',  'like', "%{$search}%")
                       ->orWhere('sessions.ip_address', 'like', "%{$search}%")
                )
            )
            ->paginate($perPage)
            ->withQueryString();
    }

    public function revokeById(string $sessionId): bool
    {
        return DB::table('sessions')->where('id', $sessionId)->delete() > 0;
    }
}
