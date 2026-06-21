<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketTemplate extends Model
{
    protected $fillable = [
        'name', 'description', 'subject', 'body', 'category_id', 'priority',
        'tag_ids', 'custom_field_defaults', 'is_active', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'tag_ids'               => 'array',
            'custom_field_defaults' => 'array',
            'is_active'             => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TicketCategory::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
