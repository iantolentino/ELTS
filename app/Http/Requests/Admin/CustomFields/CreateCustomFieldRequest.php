<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\CustomFields;

use Illuminate\Foundation\Http\FormRequest;

class CreateCustomFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole(['super_admin', 'admin']) ?? false;
    }

    public function rules(): array
    {
        return [
            'label'       => ['required', 'string', 'max:100'],
            'name'        => ['required', 'string', 'max:100', 'unique:custom_fields,name', 'regex:/^[a-z0-9_]+$/'],
            'type'        => ['required', 'string', 'in:text,textarea,number,date,select,checkbox,radio'],
            'options'     => ['nullable', 'array', 'required_if:type,select', 'required_if:type,radio'],
            'options.*'   => ['string', 'max:100'],
            'category_id' => ['nullable', 'integer', 'exists:ticket_categories,id'],
            'is_required' => ['boolean'],
            'sort_order'  => ['integer', 'min:0'],
            'is_active'   => ['boolean'],
        ];
    }
}
