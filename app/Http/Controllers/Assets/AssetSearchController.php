<?php

declare(strict_types=1);

namespace App\Http\Controllers\Assets;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AssetSearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Asset::class);

        $q       = trim((string) $request->input('q', ''));
        $exclude = array_filter(array_map('intval', (array) $request->input('exclude', [])));

        $assets = Asset::when($q !== '', function ($query) use ($q) {
                $query->where(function ($q2) use ($q) {
                    $q2->where('name', 'like', "%{$q}%")
                       ->orWhere('asset_tag', 'like', "%{$q}%")
                       ->orWhere('serial_number', 'like', "%{$q}%");
                });
            })
            ->when($exclude, fn ($query) => $query->whereNotIn('id', $exclude))
            ->orderBy('name')
            ->limit(15)
            ->get(['id', 'name', 'asset_tag', 'type', 'status'])
            ->map(fn ($a) => [
                'id'        => $a->id,
                'name'      => $a->name,
                'asset_tag' => $a->asset_tag,
                'type'      => $a->type,
                'status'    => $a->status,
            ]);

        return response()->json($assets);
    }
}
