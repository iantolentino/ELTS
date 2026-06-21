<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentUserRepository implements UserRepositoryInterface
{
    private const ALLOWED_SORT = ['name', 'email', 'created_at', 'last_login_at'];

    public function paginate(
        string $search,
        string $role,
        string $status,
        string $sortBy,
        string $sortDir,
        int    $perPage,
    ): LengthAwarePaginator {
        if (! in_array($sortBy, self::ALLOWED_SORT, true)) {
            $sortBy = 'created_at';
        }

        return User::query()
            ->with(['roles:id,name', 'team:id,name', 'department:id,name'])
            ->when($search !== '', fn ($q) => $q->where(fn ($inner) =>
                $inner->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
            ))
            ->when($role !== '', fn ($q) => $q->role($role))
            ->when($status !== '', fn ($q) => $q->where('is_active', $status === 'active'))
            ->orderBy($sortBy, $sortDir)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user;
    }
}
