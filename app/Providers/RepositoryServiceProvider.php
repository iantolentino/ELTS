<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\Repositories\DepartmentRepositoryInterface;
use App\Contracts\Repositories\TeamRepositoryInterface;
use App\Contracts\Repositories\TicketRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Repositories\EloquentDepartmentRepository;
use App\Repositories\EloquentTeamRepository;
use App\Repositories\EloquentTicketRepository;
use App\Repositories\EloquentUserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
        $this->app->bind(TeamRepositoryInterface::class, EloquentTeamRepository::class);
        $this->app->bind(DepartmentRepositoryInterface::class, EloquentDepartmentRepository::class);
        $this->app->bind(TicketRepositoryInterface::class, EloquentTicketRepository::class);
    }
}
