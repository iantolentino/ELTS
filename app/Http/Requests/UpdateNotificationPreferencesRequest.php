<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'preferences'          => ['required', 'array'],
            'preferences.*.in_app' => ['required', 'boolean'],
            'preferences.*.email'  => ['required', 'boolean'],
        ];
    }
}