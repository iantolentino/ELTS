<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        $asset = $this->route('asset');

        return $asset
            ? $this->user()->can('update', $asset)
            : $this->user()->can('create', \App\Models\Asset::class);
    }

    public function rules(): array
    {
        $assetId = $this->route('asset')?->id;

        return [
            'name'               => ['required', 'string', 'max:255'],
            'asset_tag'          => ['required', 'string', 'max:100', Rule::unique('assets', 'asset_tag')->ignore($assetId)],
            'type'               => ['required', 'string', 'max:60'],
            'status'             => ['required', Rule::in(['purchased', 'in_use', 'maintenance', 'retired'])],
            'serial_number'      => ['nullable', 'string', 'max:100', Rule::unique('assets', 'serial_number')->ignore($assetId)],
            'make'               => ['nullable', 'string', 'max:100'],
            'model'              => ['nullable', 'string', 'max:100'],
            'purchase_date'      => ['nullable', 'date'],
            'purchase_price'     => ['nullable', 'numeric', 'min:0', 'max:9999999.99'],
            'warranty_expires_at'=> ['nullable', 'date'],
            'location'           => ['nullable', 'string', 'max:255'],
            'notes'              => ['nullable', 'string', 'max:5000'],
            'assigned_to'        => ['nullable', 'exists:users,id'],
        ];
    }
}
