<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class SlaPolicy extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('sla')
            ->logOnly(['name', 'priority', 'first_response_minutes', 'resolution_minutes', 'uses_business_hours', 'is_active'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'name',
        'description',
        'priority',
        'first_response_minutes',
        'resolution_minutes',
        'uses_business_hours',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'uses_business_hours'    => 'boolean',
            'is_active'              => 'boolean',
            'first_response_minutes' => 'integer',
            'resolution_minutes'     => 'integer',
        ];
    }

    public function slaRecords(): HasMany
    {
        return $this->hasMany(SlaRecord::class);
    }

    public function businessHours(): HasMany
    {
        return $this->hasMany(BusinessHour::class);
    }

    public function holidays(): HasMany
    {
        return $this->hasMany(Holiday::class);
    }

    public function firstResponseLabel(): string
    {
        return $this->formatMinutes($this->first_response_minutes);
    }

    public function resolutionLabel(): string
    {
        return $this->formatMinutes($this->resolution_minutes);
    }

    private function formatMinutes(int $minutes): string
    {
        if ($minutes < 60) {
            return "{$minutes}m";
        }
        $hours = intdiv($minutes, 60);
        $rem   = $minutes % 60;
        return $rem > 0 ? "{$hours}h {$rem}m" : "{$hours}h";
    }
}
