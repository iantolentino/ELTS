<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Templates;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['super_admin', 'admin', 'supervisor']) ?? false;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'subject'     => ['nullable', 'string', 'max:200'],
            'body'        => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:ticket_categories,id'],
            'priority'    => ['nullable', 'string', 'in:low,medium,high,critical'],
            'tag_ids'     => ['nullable', 'array'],
            'tag_ids.*'   => ['integer', 'exists:ticket_tags,id'],
            'is_active'   => ['boolean'],
        ];
    }
}
