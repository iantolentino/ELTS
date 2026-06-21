<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

class UserService
{
    public function __construct(
        private readonly UserRepositoryInterface $users,
    ) {}

    public function listUsers(array $params): LengthAwarePaginator
    {
        return $this->users->paginate(
            search:  trim((string) ($params['search']  ?? '')),
            role:    (string) ($params['role']    ?? ''),
            status:  (string) ($params['status']  ?? ''),
            sortBy:  (string) ($params['sort_by'] ?? 'created_at'),
            sortDir: ($params['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc',
            perPage: (int) ($params['per_page'] ?? config('ticketing.pagination.per_page', 20)),
        );
    }

    public function createUser(array $data): User
    {
        $role     = $data['role'];
        $userData = Arr::except($data, ['role', 'password_confirmation']);

        $user = $this->users->create($userData);
        $user->assignRole($role);

        return $user;
    }

    public function updateAvailability(User $user, string $status): User
    {
        return $this->users->update($user, ['availability_status' => $status]);
    }

    public function updateUser(User $user, array $data): User
    {
        $role     = $data['role'] ?? null;
        $userData = Arr::except($data, ['role', 'password_confirmation']);

        if (empty($userData['password'])) {
            unset($userData['password']);
        }

        $this->users->update($user, $userData);

        if ($role) {
            $user->syncRoles([$role]);
        }

        return $user->fresh(['roles']);
    }
}
