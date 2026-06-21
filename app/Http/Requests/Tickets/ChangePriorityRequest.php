<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChangePriorityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('changePriority', Ticket::class);
    }

    public function rules(): array
    {
        return [
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
        ];
    }
}
