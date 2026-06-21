<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Statuses;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['super_admin', 'admin']) ?? false;
    }

    public function rules(): array
    {
        return [
            'name'       => ['required', 'string', 'max:50', Rule::unique('ticket_statuses', 'name')->ignore($this->route('status'))],
            'color'      => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_default' => ['boolean'],
            'is_closed'  => ['boolean'],
        ];
    }
}
