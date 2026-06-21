<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('tickets.view');
    }

    public function view(User $user, Ticket $ticket): bool
    {
        if (!$user->hasPermissionTo('tickets.view')) {
            return false;
        }

        if ($user->hasRole('client')) {
            return $ticket->requester_id === $user->id;
        }

        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('tickets.create');
    }

    public function update(User $user, Ticket $ticket): bool
    {
        if (!$user->hasPermissionTo('tickets.edit')) {
            return false;
        }

        if ($user->hasRole('client')) {
            return $ticket->requester_id === $user->id;
        }

        return true;
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->hasPermissionTo('tickets.delete');
    }

    public function merge(User $user): bool
    {
        return $user->hasPermissionTo('tickets.merge');
    }

    public function assign(User $user): bool
    {
        return $user->hasPermissionTo('tickets.assign');
    }

    public function reply(User $user, Ticket $ticket): bool
    {
        if (!$user->hasPermissionTo('tickets.reply')) {
            return false;
        }

        if ($user->hasRole('client')) {
            return $ticket->requester_id === $user->id;
        }

        return true;
    }

    public function noteInternal(User $user): bool
    {
        return $user->hasPermissionTo('tickets.note_internal');
    }

    public function changeStatus(User $user): bool
    {
        return $user->hasPermissionTo('tickets.change_status');
    }

    public function changePriority(User $user): bool
    {
        return $user->hasPermissionTo('tickets.change_priority');
    }

    public function export(User $user): bool
    {
        return $user->hasPermissionTo('tickets.export');
    }
}
