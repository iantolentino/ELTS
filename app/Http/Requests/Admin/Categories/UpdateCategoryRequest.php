<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Categories;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['super_admin', 'admin', 'supervisor']) ?? false;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:100', Rule::unique('ticket_categories', 'name')->ignore($this->route('category'))],
            'description' => ['nullable', 'string', 'max:500'],
            'parent_id'   => ['nullable', 'integer', Rule::exists('ticket_categories', 'id')->where(fn ($q) => $q->where('id', '!=', $this->route('category'))), Rule::notIn([$this->route('category')?->id])],
            'sort_order'  => ['integer', 'min:0'],
            'is_active'   => ['boolean'],
        ];
    }
}
