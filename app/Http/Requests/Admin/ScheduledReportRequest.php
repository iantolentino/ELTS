<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ScheduledReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // handled by Gate::authorize in controller
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'type'          => ['required', 'in:overview,custom'],
            'format'        => ['required', 'in:pdf,excel,csv'],
            'schedule'      => ['required', 'in:daily,weekly,monthly'],
            'day_of_week'   => ['nullable', 'integer', 'min:0', 'max:6'],
            'day_of_month'  => ['nullable', 'integer', 'min:1', 'max:31'],
            'time_of_day'   => ['required', 'date_format:H:i'],
            'recipients'    => ['required', 'string'],
            'params'        => ['nullable', 'array'],
            'params.metric'   => ['sometimes', 'in:volume,avg_resolution'],
            'params.group_by' => ['sometimes', 'in:day,week,month,priority,status,category,agent,team'],
            'is_active'     => ['boolean'],
        ];
    }

    public function resolvedRecipients(): array
    {
        return array_values(array_filter(
            array_map('trim', preg_split('/[\n,]+/', $this->string('recipients'))),
            fn ($e) => filter_var($e, FILTER_VALIDATE_EMAIL),
        ));
    }
}
