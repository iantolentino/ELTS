<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\LoginHistoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoginHistoryController extends Controller
{
    public function __construct(private readonly LoginHistoryService $loginHistoryService) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()->hasPermissionTo('audit.view'), 403);

        $filters = $request->only(['search', 'status', 'date_from', 'date_to', 'per_page', 'user_id']);

        $entries = $this->loginHistoryService->paginate($filters);

        return Inertia::render('Admin/LoginHistory/Index', [
            'entries' => $entries->through(fn ($e) => [
                'id'         => $e->id,
                'user'       => $e->user ? ['id' => $e->user->id, 'name' => $e->user->name, 'email' => $e->user->email] : null,
                'email'      => $e->email,
                'ip_address' => $e->ip_address,
                'user_agent' => $e->user_agent,
                'status'     => $e->status,
                'created_at' => $e->created_at->toISOString(),
            ]),
            'filters' => $filters,
            'users'   => User::orderBy('name')->get(['id', 'name']),
            'total'   => $entries->total(),
        ]);
    }
}
