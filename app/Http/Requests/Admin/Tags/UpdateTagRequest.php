<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Tags;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['super_admin', 'admin', 'supervisor']) ?? false;
    }

    public function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'max:50', Rule::unique('ticket_tags', 'name')->ignore($this->route('tag'))],
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
