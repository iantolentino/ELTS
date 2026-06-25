<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePushSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'endpoint'         => ['required', 'string', 'max:1000'],
            'public_key'       => ['required', 'string', 'max:255'],
            'auth_token'       => ['required', 'string', 'max:255'],
            'content_encoding' => ['sometimes', 'string', 'in:aesgcm,aes128gcm'],
        ];
    }
}