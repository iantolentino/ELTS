<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\DepartmentRepositoryInterface;
use App\Models\Department;
use Illuminate\Support\Collection;

class EloquentDepartmentRepository implements DepartmentRepositoryInterface
{
    public function all(): Collection
    {
        return Department::withCount(['teams', 'users'])
            ->orderBy('name')
            ->get();
    }

    public function create(array $data): Department
    {
        return Department::create($data);
    }

    public function update(Department $department, array $data): Department
    {
        $department->update($data);
        return $department;
    }

    public function delete(Department $department): void
    {
        $department->delete();
    }
}
