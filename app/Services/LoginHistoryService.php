<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\LoginHistory;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class LoginHistoryService
{
    public function record(string $email, string $ip, ?string $userAgent, ?int $userId, string $status): void
    {
        LoginHistory::create([
            'user_id'    => $userId,
            'email'      => $email,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'status'     => $status,
        ]);
    }

    public function forUser(User $user, int $limit = 20): Collection
    {
        return LoginHistory::where('user_id', $user->id)
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function paginate(array $filters): LengthAwarePaginator
    {
        $search   = $filters['search']   ?? null;
        $status   = $filters['status']   ?? null;
        $dateFrom = $filters['date_from'] ?? null;
        $dateTo   = $filters['date_to']   ?? null;
        $perPage  = in_array((int) ($filters['per_page'] ?? 25), [10, 25, 50, 100], true)
            ? (int) $filters['per_page']
            : 25;

        return LoginHistory::with('user:id,name,email')
            ->latest()
            ->when($search, fn ($q) =>
                $q->where(fn ($q2) =>
                    $q2->where('email', 'like', "%{$search}%")
                       ->orWhere('ip_address', 'like', "%{$search}%")
                       ->orWhereHas('user', fn ($q3) => $q3->where('name', 'like', "%{$search}%"))
                )
            )
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($dateFrom, fn ($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn ($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->paginate($perPage)
            ->withQueryString();
    }
}
