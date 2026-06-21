<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Categories;

use Illuminate\Foundation\Http\FormRequest;

class CreateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['super_admin', 'admin', 'supervisor']) ?? false;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:100', 'unique:ticket_categories,name'],
            'description' => ['nullable', 'string', 'max:500'],
            'parent_id'   => ['nullable', 'integer', 'exists:ticket_categories,id'],
            'sort_order'  => ['integer', 'min:0'],
            'is_active'   => ['boolean'],
        ];
    }
}
