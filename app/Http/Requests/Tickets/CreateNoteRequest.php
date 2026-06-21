<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;

class CreateNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Ticket $ticket */
        $ticket = $this->route('ticket');
        return $this->user()->can('noteInternal', $ticket);
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string'],
        ];
    }
}
