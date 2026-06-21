<?php

declare(strict_types=1);

namespace App\Contracts\Repositories;

use App\Models\Department;
use Illuminate\Support\Collection;

interface DepartmentRepositoryInterface
{
    public function all(): Collection;

    public function create(array $data): Department;

    public function update(Department $department, array $data): Department;

    public function delete(Department $department): void;
}
