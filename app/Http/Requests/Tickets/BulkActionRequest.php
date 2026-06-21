<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use Illuminate\Foundation\Http\FormRequest;

class BulkActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // per-action authorization handled in controller
    }

    public function rules(): array
    {
        return [
            'ticket_ids'   => ['required', 'array', 'min:1'],
            'ticket_ids.*' => ['integer', 'exists:tickets,id'],
            'action'       => ['required', 'string', 'in:assign,change_status,close,delete'],
            'assignee_id'  => ['nullable', 'required_if:action,assign', 'exists:users,id'],
            'status_id'    => ['nullable', 'required_if:action,change_status', 'exists:ticket_statuses,id'],
        ];
    }
}
