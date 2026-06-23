<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class KnowledgeCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $categoryId = $this->route('knowledgeCategory')?->id;

        return [
            'name'        => ['required', 'string', 'max:100'],
            'slug'        => ['required', 'string', 'max:120', Rule::unique('knowledge_categories', 'slug')->ignore($categoryId)],
            'description' => ['nullable', 'string', 'max:500'],
            'icon'        => ['nullable', 'string', 'max:10'],
            'parent_id'   => ['nullable', 'exists:knowledge_categories,id', Rule::notIn([$categoryId])],
            'sort_order'  => ['integer', 'min:0', 'max:999'],
            'is_active'   => ['boolean'],
        ];
    }
}
