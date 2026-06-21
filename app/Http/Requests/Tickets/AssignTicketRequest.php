<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;

class AssignTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('assign', Ticket::class);
    }

    public function rules(): array
    {
        return [
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'team_id'     => ['nullable', 'integer', 'exists:teams,id'],
        ];
    }
}
