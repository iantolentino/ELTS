<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateDepartmentRequest;
use App\Http\Requests\Admin\UpdateDepartmentRequest;
use App\Models\Department;
use App\Services\DepartmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function __construct(
        private readonly DepartmentService $departmentService,
    ) {}

    public function index(): Response
    {
        Gate::authorize('viewAny', Department::class);

        $departments = $this->departmentService->listDepartments()->map(fn ($dept) => [
            'id'          => $dept->id,
            'name'        => $dept->name,
            'description' => $dept->description,
            'teams_count' => $dept->teams_count,
            'users_count' => $dept->users_count,
            'is_active'   => $dept->is_active,
        ]);

        return Inertia::render('Admin/Departments/Index', compact('departments'));
    }

    public function create(): Response
    {
        Gate::authorize('create', Department::class);

        return Inertia::render('Admin/Departments/Create');
    }

    public function store(CreateDepartmentRequest $request): RedirectResponse
    {
        $dept = $this->departmentService->createDepartment($request->validated());

        return redirect()->route('admin.departments.edit', $dept)
            ->with('success', "Department \"{$dept->name}\" created.");
    }

    public function edit(Department $department): Response
    {
        Gate::authorize('update', $department);

        $teams = $department->teams()
            ->withCount('users')
            ->orderBy('name')
            ->get(['id', 'name', 'is_active'])
            ->map(fn ($t) => [
                'id'           => $t->id,
                'name'         => $t->name,
                'members_count'=> $t->users_count,
                'is_active'    => $t->is_active,
            ]);

        return Inertia::render('Admin/Departments/Edit', [
            'department' => [
                'id'          => $department->id,
                'name'        => $department->name,
                'description' => $department->description,
                'is_active'   => $department->is_active,
            ],
            'teams' => $teams,
        ]);
    }

    public function update(UpdateDepartmentRequest $request, Department $department): RedirectResponse
    {
        $this->departmentService->updateDepartment($department, $request->validated());

        return back()->with('success', 'Department updated successfully.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        Gate::authorize('delete', $department);

        $this->departmentService->deleteDepartment($department);

        return redirect()->route('admin.departments.index')
            ->with('success', "Department \"{$department->name}\" deleted.");
    }
}
