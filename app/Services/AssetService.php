<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetAssignment;
use Illuminate\Support\Facades\DB;

class AssetService
{
    /**
     * Assign an asset to a user, closing any current active assignment first.
     */
    public function assign(Asset $asset, int $userId, int $assignedById, ?string $notes = null): void
    {
        DB::transaction(function () use ($asset, $userId, $assignedById, $notes) {
            // Close the current active assignment if it belongs to a different user
            if ($asset->assigned_to !== null && $asset->assigned_to !== $userId) {
                AssetAssignment::where('asset_id', $asset->id)
                    ->whereNull('returned_at')
                    ->update(['returned_at' => now()]);
            }

            // Only create a new record if actually changing assignee
            if ($asset->assigned_to !== $userId) {
                AssetAssignment::create([
                    'asset_id'    => $asset->id,
                    'user_id'     => $userId,
                    'assigned_by' => $assignedById,
                    'assigned_at' => now(),
                    'notes'       => $notes,
                ]);
            }

            $asset->update(['assigned_to' => $userId, 'status' => 'in_use']);
        });
    }

    /**
     * Return an asset — closes the active assignment and marks the asset unassigned.
     */
    public function unassign(Asset $asset): void
    {
        DB::transaction(function () use ($asset) {
            AssetAssignment::where('asset_id', $asset->id)
                ->whereNull('returned_at')
                ->update(['returned_at' => now()]);

            $asset->update(['assigned_to' => null]);
        });
    }

    /**
     * Change the lifecycle status of an asset.
     * Moving to maintenance/retired while assigned automatically returns the asset first.
     */
    public function changeStatus(Asset $asset, string $newStatus): void
    {
        DB::transaction(function () use ($asset, $newStatus) {
            if (in_array($newStatus, ['maintenance', 'retired'], true) && $asset->assigned_to !== null) {
                $this->unassign($asset);
            }

            $asset->update(['status' => $newStatus]);
        });
    }

    /**
     * Called from the edit form when assigned_to changes — delegates to assign/unassign.
     */
    public function syncAssignment(Asset $asset, ?int $newUserId, int $actorId): void
    {
        if ($newUserId === null) {
            if ($asset->assigned_to !== null) {
                $this->unassign($asset);
            }
        } else {
            if ($asset->assigned_to !== $newUserId) {
                $this->assign($asset, $newUserId, $actorId);
            }
        }
    }
}
