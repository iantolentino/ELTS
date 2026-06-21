<?php

declare(strict_types=1);

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class ProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255'],
            'phone'     => ['nullable', 'string', 'max:20'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'timezone'  => ['required', 'string', 'timezone:all'],
            'locale'    => ['required', 'string', 'in:en'],
            'avatar'    => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ];
    }
}
