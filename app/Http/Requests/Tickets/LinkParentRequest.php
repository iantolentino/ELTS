<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class LinkParentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('ticket'));
    }

    public function rules(): array
    {
        /** @var \App\Models\Ticket $ticket */
        $ticket = $this->route('ticket');

        return [
            'parent_ticket_id' => [
                'required',
                'integer',
                Rule::exists('tickets', 'id')->whereNull('deleted_at')->whereNull('merged_into_id'),
                Rule::notIn([$ticket->id]),
                Rule::notIn($ticket->childTickets()->pluck('id')->all()),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'parent_ticket_id.not_in' => 'Cannot create a circular parent-child relationship.',
        ];
    }
}
