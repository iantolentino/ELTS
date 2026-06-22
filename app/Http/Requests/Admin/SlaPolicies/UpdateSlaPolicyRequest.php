<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\SlaPolicies;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use App\Models\SlaPolicy;

class UpdateSlaPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', SlaPolicy::class);
    }

    public function rules(): array
    {
        return [
            'name'                    => ['required', 'string', 'max:100'],
            'description'             => ['nullable', 'string', 'max:1000'],
            'priority'                => ['nullable', 'in:low,medium,high,critical'],
            'first_response_minutes'  => ['required', 'integer', 'min:1', 'max:44640'],
            'resolution_minutes'      => ['required', 'integer', 'min:1', 'max:44640'],
            'uses_business_hours'     => ['boolean'],
            'is_active'               => ['boolean'],
        ];
    }
}
