<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Team;
use Illuminate\Foundation\Http\FormRequest;

class CreateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Team::class);
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:100', 'unique:teams,name'],
            'description'   => ['nullable', 'string', 'max:500'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'is_active'     => ['boolean'],
        ];
    }
}
