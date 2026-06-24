<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AssetRequest;
use App\Models\Asset;
use App\Services\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AssetController extends Controller
{
    public function __construct(private readonly AssetService $assetService) {}
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Asset::class);

        $query = Asset::with(['assignee:id,name,avatar'])
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('asset_tag', 'like', "%{$search}%")
                      ->orWhere('serial_number', 'like', "%{$search}%")
                      ->orWhere('make', 'like', "%{$search}%")
                      ->orWhere('model', 'like', "%{$search}%");
                });
            })
            ->when($request->input('type'), fn ($q, $v) => $q->where('type', $v))
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->when($request->input('assignee_id'), fn ($q, $v) => $q->where('assigned_to', $v));

        $sortBy  = in_array($request->input('sort_by'), ['name', 'asset_tag', 'type', 'status', 'created_at'])
            ? $request->input('sort_by', 'created_at')
            : 'created_at';
        $sortDir = $request->input('sort_dir', 'desc') === 'asc' ? 'asc' : 'desc';

        $assets = $query->orderBy($sortBy, $sortDir)
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($a) => [
                'id'                  => $a->id,
                'name'                => $a->name,
                'asset_tag'           => $a->asset_tag,
                'type'                => $a->type,
                'status'              => $a->status,
                'make'                => $a->make,
                'model'               => $a->model,
                'warranty_expires_at' => $a->warranty_expires_at?->toDateString(),
                'warranty_expired'    => $a->isWarrantyExpired(),
                'location'            => $a->location,
                'assignee'            => $a->assignee ? ['id' => $a->assignee->id, 'name' => $a->assignee->name] : null,
            ]);

        $types = DB::table('assets')->distinct()->orderBy('type')->pluck('type');

        $agents = DB::table('users')
            ->join('model_has_roles', fn ($j) =>
                $j->on('users.id', '=', 'model_has_roles.model_id')
                  ->where('model_has_roles.model_type', 'App\\Models\\User'))
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('users.is_active', true)
            ->whereIn('roles.name', ['agent', 'supervisor', 'admin', 'super_admin'])
            ->distinct()
            ->orderBy('users.name')
            ->get(['users.id', 'users.name'])
            ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name]);

        return Inertia::render('Admin/Assets/Index', [
            'assets'  => $assets,
            'types'   => $types,
            'agents'  => $agents,
            'filters' => $request->only(['search', 'type', 'status', 'assignee_id', 'sort_by', 'sort_dir']),
            'can'     => [
                'create' => $request->user()->can('create', Asset::class),
                'edit'   => $request->user()->can('update', new Asset()),
                'delete' => $request->user()->can('delete', new Asset()),
            ],
        ]);
    }

    public function show(Request $request, Asset $asset): Response
    {
        Gate::authorize('view', $asset);

        $asset->load([
            'assignee:id,name,avatar',
            'creator:id,name',
            'assignments' => fn ($q) => $q->with([
                'user:id,name',
                'assignedBy:id,name',
            ])->latest('assigned_at'),
            'tickets' => fn ($q) => $q->with([
                'status:id,name,color',
                'requester:id,name',
            ])->whereNull('deleted_at')->latest(),
        ]);

        return Inertia::render('Admin/Assets/Show', [
            'asset' => [
                'id'                  => $asset->id,
                'name'                => $asset->name,
                'asset_tag'           => $asset->asset_tag,
                'type'                => $asset->type,
                'status'              => $asset->status,
                'serial_number'       => $asset->serial_number,
                'make'                => $asset->make,
                'model'               => $asset->model,
                'purchase_date'       => $asset->purchase_date?->toDateString(),
                'purchase_price'      => $asset->purchase_price,
                'warranty_expires_at' => $asset->warranty_expires_at?->toDateString(),
                'warranty_expired'    => $asset->isWarrantyExpired(),
                'location'            => $asset->location,
                'notes'               => $asset->notes,
                'created_at'          => $asset->created_at->toDateString(),
                'assignee'            => $asset->assignee
                    ? ['id' => $asset->assignee->id, 'name' => $asset->assignee->name]
                    : null,
                'creator'             => $asset->creator
                    ? ['id' => $asset->creator->id, 'name' => $asset->creator->name]
                    : null,
                'assignments'         => $asset->assignments->map(fn ($a) => [
                    'id'          => $a->id,
                    'user'        => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name] : null,
                    'assigned_by' => $a->assignedBy ? ['id' => $a->assignedBy->id, 'name' => $a->assignedBy->name] : null,
                    'assigned_at' => $a->assigned_at->toDateTimeString(),
                    'returned_at' => $a->returned_at?->toDateTimeString(),
                    'notes'       => $a->notes,
                    'is_active'   => $a->isActive(),
                ])->values(),
                'tickets'             => $asset->tickets->map(fn ($t) => [
                    'id'             => $t->id,
                    'ticket_number'  => $t->ticket_number,
                    'subject'        => $t->subject,
                    'status'         => ['name' => $t->status->name, 'color' => $t->status->color],
                    'requester'      => $t->requester ? ['name' => $t->requester->name] : null,
                    'created_at'     => $t->created_at->toDateString(),
                ])->values(),
            ],
            'agents' => $this->agentsList(),
            'can' => [
                'edit'   => $request->user()->can('update', $asset),
                'delete' => $request->user()->can('delete', $asset),
                'assign' => $request->user()->can('assign', $asset),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        Gate::authorize('create', Asset::class);

        return Inertia::render('Admin/Assets/Create', [
            'agents'     => $this->agentsList(),
            'asset_types'=> $this->commonTypes(),
        ]);
    }

    public function store(AssetRequest $request): RedirectResponse
    {
        $validated  = $request->validated();
        $assignedTo = $validated['assigned_to'] ? (int) $validated['assigned_to'] : null;

        $asset = Asset::create(array_merge(
            $validated,
            ['created_by' => $request->user()->id, 'assigned_to' => null],
        ));

        if ($assignedTo !== null) {
            $this->assetService->assign($asset, $assignedTo, $request->user()->id);
        }

        return redirect()->route('admin.assets.show', $asset)
            ->with('success', 'Asset created successfully.');
    }

    public function edit(Request $request, Asset $asset): Response
    {
        Gate::authorize('update', $asset);

        return Inertia::render('Admin/Assets/Edit', [
            'asset'      => [
                'id'                  => $asset->id,
                'name'                => $asset->name,
                'asset_tag'           => $asset->asset_tag,
                'type'                => $asset->type,
                'status'              => $asset->status,
                'serial_number'       => $asset->serial_number,
                'make'                => $asset->make,
                'model'               => $asset->model,
                'purchase_date'       => $asset->purchase_date?->toDateString(),
                'purchase_price'      => $asset->purchase_price,
                'warranty_expires_at' => $asset->warranty_expires_at?->toDateString(),
                'location'            => $asset->location,
                'notes'               => $asset->notes,
                'assigned_to'         => $asset->assigned_to,
            ],
            'agents'     => $this->agentsList(),
            'asset_types'=> $this->commonTypes(),
        ]);
    }

    public function update(AssetRequest $request, Asset $asset): RedirectResponse
    {
        $validated  = $request->validated();
        $newUserId  = isset($validated['assigned_to']) && $validated['assigned_to'] !== ''
            ? (int) $validated['assigned_to']
            : null;

        // Sync assignment history before saving other fields
        $this->assetService->syncAssignment($asset, $newUserId, $request->user()->id);

        // Update non-assignment fields (assigned_to already handled by service)
        $asset->update(array_diff_key($validated, ['assigned_to' => true]));

        return redirect()->route('admin.assets.show', $asset)
            ->with('success', 'Asset updated successfully.');
    }

    public function destroy(Request $request, Asset $asset): RedirectResponse
    {
        Gate::authorize('delete', $asset);

        $asset->tickets()->detach();
        $asset->delete();

        return redirect()->route('admin.assets.index')
            ->with('success', 'Asset deleted.');
    }

    /* ── Helpers ─────────────────────────────────────────────────────────── */

    private function agentsList(): array
    {
        return DB::table('users')
            ->join('model_has_roles', fn ($j) =>
                $j->on('users.id', '=', 'model_has_roles.model_id')
                  ->where('model_has_roles.model_type', 'App\\Models\\User'))
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('users.is_active', true)
            ->whereIn('roles.name', ['agent', 'supervisor', 'admin', 'super_admin'])
            ->distinct()
            ->orderBy('users.name')
            ->get(['users.id', 'users.name'])
            ->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])
            ->all();
    }

    private function commonTypes(): array
    {
        return [
            'laptop', 'desktop', 'monitor', 'phone', 'tablet',
            'printer', 'keyboard', 'mouse', 'headset', 'server',
            'networking', 'software', 'other',
        ];
    }
}
