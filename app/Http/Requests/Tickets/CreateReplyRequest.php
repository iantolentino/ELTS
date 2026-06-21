<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;

class CreateReplyRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Ticket $ticket */
        $ticket = $this->route('ticket');
        return $this->user()->can('reply', $ticket);
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string'],
            'cc'   => ['nullable', 'array'],
            'cc.*' => ['email'],
            'bcc'  => ['nullable', 'array'],
            'bcc.*'=> ['email'],
        ];
    }
}
