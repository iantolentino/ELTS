<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    public function rules(): array
    {
        return [
            'name'                  => ['required', 'string', 'max:255'],
            'email'                 => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'phone'                 => ['nullable', 'string', 'max:20'],
            'job_title'             => ['nullable', 'string', 'max:100'],
            'role'                  => ['required', 'string', Rule::in(Role::pluck('name'))],
            'team_id'               => ['nullable', 'integer', 'exists:teams,id'],
            'department_id'         => ['nullable', 'integer', 'exists:departments,id'],
            'timezone'              => ['nullable', 'string', 'max:50'],
            'locale'                => ['nullable', 'string', 'max:10'],
            'is_active'             => ['boolean'],
            'is_vip'                => ['boolean'],
        ];
    }
}
