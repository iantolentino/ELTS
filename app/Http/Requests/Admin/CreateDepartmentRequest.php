<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Department;
use Illuminate\Foundation\Http\FormRequest;

class CreateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Department::class);
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:100', 'unique:departments,name'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active'   => ['boolean'],
        ];
    }
}
