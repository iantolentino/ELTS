<?php

declare(strict_types=1);

namespace App\Contracts\Repositories;

use App\Models\Ticket;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TicketRepositoryInterface
{
    public function paginate(array $params): LengthAwarePaginator;

    public function findOrFail(int $id): Ticket;

    public function create(array $data): Ticket;

    public function update(Ticket $ticket, array $data): Ticket;

    public function delete(Ticket $ticket): void;
}
