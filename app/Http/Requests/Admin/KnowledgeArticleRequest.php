<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class KnowledgeArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $articleId = $this->route('knowledgeArticle')?->id;

        return [
            'knowledge_category_id' => ['required', 'exists:knowledge_categories,id'],
            'title'                 => ['required', 'string', 'max:255'],
            'slug'                  => ['required', 'string', 'max:255', Rule::unique('knowledge_articles', 'slug')->ignore($articleId)],
            'excerpt'               => ['nullable', 'string', 'max:500'],
            'content'               => ['required', 'string'],
            'status'                => ['required', Rule::in(['draft', 'published'])],
            'is_public'             => ['boolean'],
        ];
    }
}
