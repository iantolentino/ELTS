<?php

declare(strict_types=1);

namespace App\Contracts\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    public function paginate(
        string $search,
        string $role,
        string $status,
        string $sortBy,
        string $sortDir,
        int    $perPage,
    ): LengthAwarePaginator;

    public function create(array $data): \App\Models\User;

    public function update(\App\Models\User $user, array $data): \App\Models\User;
}
