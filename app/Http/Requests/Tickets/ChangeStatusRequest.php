<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;

class ChangeStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('changeStatus', Ticket::class);
    }

    public function rules(): array
    {
        return [
            'status_id' => ['required', 'integer', 'exists:ticket_statuses,id'],
        ];
    }
}
