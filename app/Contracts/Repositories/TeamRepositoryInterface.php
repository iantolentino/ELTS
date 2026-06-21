<?php

declare(strict_types=1);

namespace App\Contracts\Repositories;

use App\Models\Team;
use Illuminate\Support\Collection;

interface TeamRepositoryInterface
{
    public function all(): Collection;

    public function create(array $data): Team;

    public function update(Team $team, array $data): Team;

    public function delete(Team $team): void;
}
