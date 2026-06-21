<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('departments.edit');
    }

    public function rules(): array
    {
        $deptId = $this->route('department')?->id;

        return [
            'name'        => ['required', 'string', 'max:100', Rule::unique('departments', 'name')->ignore($deptId)],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active'   => ['boolean'],
        ];
    }
}
