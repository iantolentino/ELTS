<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Ticket::class);
    }

    public function rules(): array
    {
        return [
            'subject'     => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'priority'    => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'category_id' => ['nullable', 'integer', 'exists:ticket_categories,id'],
            'status_id'   => ['nullable', 'integer', 'exists:ticket_statuses,id'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'team_id'     => ['nullable', 'integer', 'exists:teams,id'],
            'is_vip'      => ['nullable', 'boolean'],
            'due_at'      => ['nullable', 'date'],
        ];
    }
}
