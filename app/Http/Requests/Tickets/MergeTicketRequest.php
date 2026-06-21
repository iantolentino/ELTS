<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class MergeTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('merge', \App\Models\Ticket::class);
    }

    public function rules(): array
    {
        /** @var \App\Models\Ticket $source */
        $source = $this->route('ticket');

        return [
            'target_ticket_id' => [
                'required',
                'integer',
                Rule::exists('tickets', 'id')->whereNull('deleted_at')->whereNull('merged_into_id'),
                Rule::notIn([$source->id]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'target_ticket_id.not_in' => 'A ticket cannot be merged into itself.',
        ];
    }
}
