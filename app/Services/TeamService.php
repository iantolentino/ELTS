<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\Repositories\TeamRepositoryInterface;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class TeamService
{
    public function __construct(
        private readonly TeamRepositoryInterface $teams,
    ) {}

    public function listTeams(): Collection
    {
        return $this->teams->all();
    }

    public function createTeam(array $data): Team
    {
        return $this->teams->create($data);
    }

    public function updateTeam(Team $team, array $data): Team
    {
        $memberIds = $data['member_ids'] ?? [];
        $teamData  = Arr::except($data, ['member_ids']);

        $this->teams->update($team, $teamData);
        $this->syncMembers($team, $memberIds);

        return $team->fresh();
    }

    public function deleteTeam(Team $team): void
    {
        $team->users()->update(['team_id' => null]);
        $this->teams->delete($team);
    }

    private function syncMembers(Team $team, array $memberIds): void
    {
        User::where('team_id', $team->id)
            ->whereNotIn('id', $memberIds)
            ->update(['team_id' => null]);

        if (! empty($memberIds)) {
            User::whereIn('id', $memberIds)
                ->update(['team_id' => $team->id]);
        }
    }
}
