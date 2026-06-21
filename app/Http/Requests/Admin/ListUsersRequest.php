<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class ListUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('viewAny', User::class);
    }

    public function rules(): array
    {
        return [
            'search'   => ['nullable', 'string', 'max:100'],
            'role'     => ['nullable', 'string', 'max:50'],
            'status'   => ['nullable', 'in:active,inactive'],
            'sort_by'  => ['nullable', 'in:name,email,created_at,last_login_at'],
            'sort_dir' => ['nullable', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'in:15,25,50,100'],
        ];
    }
}
