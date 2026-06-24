<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Services\AssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AssetStatusController extends Controller
{
    public function __construct(private readonly AssetService $assetService) {}

    /** PATCH /admin/assets/{asset}/status */
    public function update(Request $request, Asset $asset): RedirectResponse
    {
        Gate::authorize('update', $asset);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['purchased', 'in_use', 'maintenance', 'retired'])],
        ]);

        if ($validated['status'] === $asset->status) {
            return back()->with('error', 'Asset already has that status.');
        }

        $this->assetService->changeStatus($asset, $validated['status']);

        $label = ucfirst(str_replace('_', ' ', $validated['status']));

        return back()->with('success', "Asset status changed to {$label}.");
    }
}
