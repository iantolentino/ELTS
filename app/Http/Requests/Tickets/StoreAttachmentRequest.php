<?php

declare(strict_types=1);

namespace App\Http\Requests\Tickets;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('ticket'));
    }

    public function rules(): array
    {
        $maxMb = (int) config('ticketing.tickets.max_attachment_size_mb', 10);

        return [
            'file'  => ['required', 'file', "max:{$maxMb}048"],
            'reply_id' => ['nullable', 'integer', 'exists:ticket_replies,id'],
            'note_id'  => ['nullable', 'integer', 'exists:ticket_notes,id'],
        ];
    }
}
