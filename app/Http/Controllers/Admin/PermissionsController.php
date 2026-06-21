<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRolePermissionsRequest;
use App\Services\RoleService;
use Illuminate\Http\RedirectResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Inertia\Inertia;
use Inertia\Response;

class PermissionsController extends Controller
{
    public function __construct(
        private readonly RoleService $roleService,
    ) {}

    public function index(): Response
    {
        abort_unless(auth()->user()->hasPermissionTo('settings.security'), 403);

        $roles = Role::with('permissions:id,name')->orderBy('name')->get(['id', 'name']);

        $groups = Permission::orderBy('name')
            ->get(['id', 'name'])
            ->groupBy(fn ($p) => explode('.', $p->name)[0])
            ->map(fn ($perms, $module) => [
                'module'      => $module,
                'permissions' => $perms->map(fn ($p) => [
                    'name'  => $p->name,
                    'label' => str_replace('_', ' ', explode('.', $p->name, 2)[1] ?? $p->name),
                ])->values(),
            ])
            ->values();

        $rolePermissions = $roles->mapWithKeys(fn ($role) => [
            $role->name => $role->permissions->pluck('name')->all(),
        ]);

        return Inertia::render('Admin/Permissions/Index', [
            'roles'             => $roles->map(fn ($r) => ['id' => $r->id, 'name' => $r->name]),
            'permission_groups' => $groups,
            'role_permissions'  => $rolePermissions,
        ]);
    }

    public function update(UpdateRolePermissionsRequest $request, string $roleName): RedirectResponse
    {
        $role = Role::where('name', $roleName)->firstOrFail();

        if ($role->name === 'super_admin') {
            abort(403, 'super_admin permissions cannot be modified.');
        }

        $this->roleService->syncPermissions($role, $request->validated()['permissions'] ?? []);

        return back()->with('success', "Permissions saved for role: {$role->name}.");
    }
}
