<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomField extends Model
{
    protected $fillable = [
        'name', 'label', 'type', 'category_id', 'options',
        'is_required', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'options'     => 'array',
            'is_required' => 'boolean',
            'is_active'   => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TicketCategory::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(CustomFieldValue::class);
    }
}
