<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'format',
        'schedule',
        'day_of_week',
        'day_of_month',
        'time_of_day',
        'recipients',
        'params',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'recipients'   => 'array',
        'params'       => 'array',
        'is_active'    => 'boolean',
        'day_of_week'  => 'integer',
        'day_of_month' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
