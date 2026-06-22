<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Mailboxes;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class CreateMailboxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', \App\Models\Mailbox::class);
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:255'],
            'host'            => ['required', 'string', 'max:255'],
            'port'            => ['required', 'integer', 'min:1', 'max:65535'],
            'encryption'      => ['required', Rule::in(['ssl', 'tls', 'starttls', 'none'])],
            'username'        => ['required', 'string', 'max:255'],
            'password'        => ['required', 'string', 'max:255'],
            'mailbox_folder'  => ['required', 'string', 'max:255'],
            'is_active'       => ['boolean'],
        ];
    }
}
