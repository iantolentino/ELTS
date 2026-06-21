<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('teams.edit');
    }

    public function rules(): array
    {
        $teamId = $this->route('team')?->id;

        return [
            'name'          => ['required', 'string', 'max:100', Rule::unique('teams', 'name')->ignore($teamId)],
            'description'   => ['nullable', 'string', 'max:500'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'is_active'     => ['boolean'],
            'member_ids'    => ['nullable', 'array'],
            'member_ids.*'  => ['integer', 'exists:users,id'],
        ];
    }
}
