<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Services\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AssetAssignmentController extends Controller
{
    public function __construct(private readonly AssetService $assetService) {}

    /** POST /admin/assets/{asset}/assign — assign to a user */
    public function store(Request $request, Asset $asset): RedirectResponse
    {
        Gate::authorize('assign', $asset);

        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'notes'   => ['nullable', 'string', 'max:500'],
        ]);

        $this->assetService->assign(
            $asset,
            (int) $validated['user_id'],
            $request->user()->id,
            $validated['notes'] ?? null,
        );

        return back()->with('success', 'Asset assigned successfully.');
    }

    /** DELETE /admin/assets/{asset}/assign — return / unassign */
    public function destroy(Request $request, Asset $asset): RedirectResponse
    {
        Gate::authorize('assign', $asset);

        if ($asset->assigned_to === null) {
            return back()->with('error', 'Asset is not currently assigned.');
        }

        $this->assetService->unassign($asset);

        return back()->with('success', 'Asset returned successfully.');
    }
}
