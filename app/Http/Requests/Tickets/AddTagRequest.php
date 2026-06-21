<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use App\Models\Ticket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class AddTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('ticket'));
    }

    public function rules(): array
    {
        return [
            'tag_id' => ['required', 'integer', 'exists:ticket_tags,id'],
        ];
    }
}
