<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateUserRequest;
use App\Http\Requests\Admin\ListUsersRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Department;
use App\Models\Team;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    public function index(ListUsersRequest $request): Response
    {
        $filters = $request->only(['search', 'role', 'status', 'sort_by', 'sort_dir', 'per_page']);

        $users = $this->userService->listUsers($filters);

        return Inertia::render('Admin/Users/Index', [
            'users'   => $users->through(fn ($user) => [
                'id'                  => $user->id,
                'name'                => $user->name,
                'email'               => $user->email,
                'avatar'              => $user->avatar
                    ? Storage::disk('public')->url($user->avatar)
                    : null,
                'job_title'           => $user->job_title,
                'roles'               => $user->roles->pluck('name')->all(),
                'team'                => $user->team?->name,
                'department'          => $user->department?->name,
                'availability_status' => $user->availability_status,
                'is_active'           => $user->is_active,
                'is_vip'              => $user->is_vip,
                'last_login_at'       => $user->last_login_at?->diffForHumans(),
                'created_at'          => $user->created_at->format('M d, Y'),
            ]),
            'filters' => array_merge([
                'search'   => '',
                'role'     => '',
                'status'   => '',
                'sort_by'  => 'created_at',
                'sort_dir' => 'desc',
                'per_page' => 20,
            ], array_filter($filters, fn ($v) => $v !== null)),
            'roles'   => Role::orderBy('name')->pluck('name'),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', User::class);

        return Inertia::render('Admin/Users/Create', [
            'roles'       => Role::orderBy('name')->pluck('name'),
            'teams'       => Team::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(CreateUserRequest $request): RedirectResponse
    {
        $user = $this->userService->createUser($request->validated());

        return redirect()->route('admin.users.index')
            ->with('success', "User {$user->name} created successfully.");
    }

    public function edit(User $user): Response
    {
        Gate::authorize('update', $user);

        return Inertia::render('Admin/Users/Edit', [
            'user'        => [
                'id'                  => $user->id,
                'name'                => $user->name,
                'email'               => $user->email,
                'phone'               => $user->phone,
                'job_title'           => $user->job_title,
                'timezone'            => $user->timezone,
                'locale'              => $user->locale,
                'role'                => $user->roles->first()?->name ?? '',
                'team_id'             => $user->team_id,
                'department_id'       => $user->department_id,
                'availability_status' => $user->availability_status,
                'is_active'           => $user->is_active,
                'is_vip'              => $user->is_vip,
            ],
            'roles'       => Role::orderBy('name')->pluck('name'),
            'teams'       => Team::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'departments' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->userService->updateUser($user, $request->validated());

        return back()->with('success', 'User updated successfully.');
    }
}
