<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Repositories\DepartmentRepositoryInterface;
use App\Models\Department;
use Illuminate\Support\Collection;

class DepartmentService
{
    public function __construct(
        private readonly DepartmentRepositoryInterface $departments,
    ) {}

    public function listDepartments(): Collection
    {
        return $this->departments->all();
    }

    public function createDepartment(array $data): Department
    {
        return $this->departments->create($data);
    }

    public function updateDepartment(Department $department, array $data): Department
    {
        return $this->departments->update($department, $data);
    }

    public function deleteDepartment(Department $department): void
    {
        $department->users()->update(['department_id' => null]);
        $department->teams()->update(['department_id' => null]);
        $this->departments->delete($department);
    }
}
