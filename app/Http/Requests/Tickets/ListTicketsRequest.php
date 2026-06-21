<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;

class ListTicketsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', Ticket::class);
    }

    public function rules(): array
    {
        return [
            'search'      => ['sometimes', 'string', 'max:100'],
            'status_id'   => ['sometimes', 'nullable', 'integer'],
            'priority'    => ['sometimes', 'nullable', 'string', 'in:low,medium,high,critical'],
            'category_id' => ['sometimes', 'nullable', 'integer'],
            'assignee_id' => ['sometimes', 'nullable', 'string'],
            'team_id'     => ['sometimes', 'nullable', 'integer'],
            'date_from'   => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'date_to'     => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'sort_by'     => ['sometimes', 'nullable', 'string', 'in:created_at,updated_at,ticket_number,subject,priority'],
            'sort_dir'    => ['sometimes', 'nullable', 'string', 'in:asc,desc'],
            'per_page'    => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
