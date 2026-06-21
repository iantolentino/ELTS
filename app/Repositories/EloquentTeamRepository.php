<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Contracts\Repositories\TeamRepositoryInterface;
use App\Models\Team;
use Illuminate\Support\Collection;

class EloquentTeamRepository implements TeamRepositoryInterface
{
    public function all(): Collection
    {
        return Team::withCount('users')
            ->with('department:id,name')
            ->orderBy('name')
            ->get();
    }

    public function create(array $data): Team
    {
        return Team::create($data);
    }

    public function update(Team $team, array $data): Team
    {
        $team->update($data);
        return $team;
    }

    public function delete(Team $team): void
    {
        $team->delete();
    }
}
