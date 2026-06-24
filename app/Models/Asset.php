<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Asset extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('asset')
            ->logOnly(['name', 'asset_tag', 'type', 'status', 'assigned_to', 'location', 'serial_number'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'name',
        'asset_tag',
        'type',
        'status',
        'serial_number',
        'make',
        'model',
        'purchase_date',
        'purchase_price',
        'warranty_expires_at',
        'location',
        'notes',
        'assigned_to',
        'created_by',
    ];

    protected $casts = [
        'purchase_date'       => 'date',
        'purchase_price'      => 'decimal:2',
        'warranty_expires_at' => 'date',
    ];

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(AssetAssignment::class)->latest('assigned_at');
    }

    public function tickets(): BelongsToMany
    {
        return $this->belongsToMany(Ticket::class, 'ticket_assets');
    }

    public function isWarrantyExpired(): bool
    {
        return $this->warranty_expires_at !== null && $this->warranty_expires_at->isPast();
    }
}
