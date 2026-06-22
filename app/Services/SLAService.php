<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\BusinessHour;
use App\Models\Holiday;
use App\Models\SlaPolicy;
use App\Models\SlaRecord;
use App\Models\Ticket;
use Carbon\Carbon;

class SLAService
{
    // Mon–Fri 09:00–17:00 UTC used when no DB config exists
    private const DEFAULT_HOURS = [
        0 => ['is_open' => false, 'open' => '00:00', 'close' => '00:00', 'tz' => 'UTC'],
        1 => ['is_open' => true,  'open' => '09:00', 'close' => '17:00', 'tz' => 'UTC'],
        2 => ['is_open' => true,  'open' => '09:00', 'close' => '17:00', 'tz' => 'UTC'],
        3 => ['is_open' => true,  'open' => '09:00', 'close' => '17:00', 'tz' => 'UTC'],
        4 => ['is_open' => true,  'open' => '09:00', 'close' => '17:00', 'tz' => 'UTC'],
        5 => ['is_open' => true,  'open' => '09:00', 'close' => '17:00', 'tz' => 'UTC'],
        6 => ['is_open' => false, 'open' => '00:00', 'close' => '00:00', 'tz' => 'UTC'],
    ];

    public function createRecord(Ticket $ticket): SlaRecord
    {
        $policy = $this->findPolicy($ticket);
        $start  = $ticket->created_at ?? now();

        $firstResponseDue = $policy
            ? $this->calculateDue($start, $policy->first_response_minutes, $policy)
            : null;

        $resolutionDue = $policy
            ? $this->calculateDue($start, $policy->resolution_minutes, $policy)
            : null;

        return SlaRecord::create([
            'ticket_id'          => $ticket->id,
            'sla_policy_id'      => $policy?->id,
            'first_response_due' => $firstResponseDue,
            'resolution_due'     => $resolutionDue,
        ]);
    }

    /**
     * Mark first-response SLA met or breached. Call when an agent first replies.
     */
    public function checkFirstResponseMet(Ticket $ticket): void
    {
        $record = $ticket->slaRecord;
        if (!$record || $record->first_response_met_at) {
            return;
        }

        $now      = now();
        $breached = $record->first_response_due && $now->gt($record->first_response_due);

        $record->update([
            'first_response_met_at'   => $now,
            'first_response_breached' => $breached,
        ]);
    }

    /**
     * Mark resolution SLA met or breached. Call when ticket is resolved or closed.
     */
    public function checkResolutionMet(Ticket $ticket): void
    {
        $record = $ticket->slaRecord;
        if (!$record || $record->resolution_met_at) {
            return;
        }

        $now      = now();
        $breached = $record->resolution_due && $now->gt($record->resolution_due);

        $record->update([
            'resolution_met_at'   => $now,
            'resolution_breached' => $breached,
        ]);
    }

    /**
     * Pause the SLA clock. No-op if already paused or no record exists.
     */
    public function pause(Ticket $ticket): void
    {
        $record = $ticket->slaRecord;
        if (!$record || $record->isPaused()) {
            return;
        }

        $record->update(['paused_at' => now()]);
    }

    /**
     * Resume the SLA clock. Extends due times by the wall-clock minutes spent paused.
     */
    public function resume(Ticket $ticket): void
    {
        $record = $ticket->slaRecord;
        if (!$record || !$record->isPaused()) {
            return;
        }

        $minutesPaused = (int) $record->paused_at->diffInMinutes(now());

        $updates = [
            'paused_at'      => null,
            'paused_minutes' => $record->paused_minutes + $minutesPaused,
        ];

        if ($record->first_response_due && !$record->first_response_met_at) {
            $updates['first_response_due'] = $record->first_response_due->addMinutes($minutesPaused);
        }

        if ($record->resolution_due && !$record->resolution_met_at) {
            $updates['resolution_due'] = $record->resolution_due->addMinutes($minutesPaused);
        }

        $record->update($updates);
    }

    public function findPolicy(Ticket $ticket): ?SlaPolicy
    {
        // Priority-specific policy wins over catch-all
        return SlaPolicy::where('priority', $ticket->priority)->where('is_active', true)->first()
            ?? SlaPolicy::whereNull('priority')->where('is_active', true)->first();
    }

    public function calculateDue(Carbon $start, int $minutes, SlaPolicy $policy): Carbon
    {
        if (!$policy->uses_business_hours) {
            return $start->copy()->addMinutes($minutes);
        }

        return $this->addBusinessMinutes($start, $minutes, $policy);
    }

    private function addBusinessMinutes(Carbon $start, int $minutes, SlaPolicy $policy): Carbon
    {
        $hoursMap = $this->loadHoursMap($policy);
        $holidays = $this->loadHolidayDates($policy);

        $tz = collect($hoursMap)->firstWhere('is_open', true)['tz'] ?? 'UTC';

        $current   = $start->copy()->setTimezone($tz);
        $remaining = $minutes;
        $safety    = 0;

        $current = $this->advanceToBusinessHours($current, $hoursMap, $holidays);

        while ($remaining > 0 && $safety < 5000) {
            $safety++;

            $dayInfo = $hoursMap[$current->dayOfWeek] ?? null;

            if (!$dayInfo || !$dayInfo['is_open'] || $this->isHoliday($current, $holidays)) {
                $current = $this->nextBusinessDayStart($current->copy()->addDay()->startOfDay(), $hoursMap, $holidays);
                continue;
            }

            $dayTz     = $dayInfo['tz'];
            $closeTime = Carbon::createFromFormat('H:i', $dayInfo['close'], $dayTz)
                ->setDate($current->year, $current->month, $current->day);

            $minutesToClose = (int) $current->diffInMinutes($closeTime, false);

            if ($minutesToClose <= 0) {
                $current = $this->nextBusinessDayStart($current->copy()->addDay()->startOfDay(), $hoursMap, $holidays);
                continue;
            }

            if ($remaining <= $minutesToClose) {
                $current->addMinutes($remaining);
                $remaining = 0;
            } else {
                $remaining -= $minutesToClose;
                $current = $this->nextBusinessDayStart($current->copy()->addDay()->startOfDay(), $hoursMap, $holidays);
            }
        }

        return $current->setTimezone('UTC');
    }

    private function advanceToBusinessHours(Carbon $current, array $hoursMap, array $holidays): Carbon
    {
        $safety = 0;
        while ($safety < 365) {
            $safety++;
            $dayInfo = $hoursMap[$current->dayOfWeek] ?? null;

            if (!$dayInfo || !$dayInfo['is_open'] || $this->isHoliday($current, $holidays)) {
                $current = $this->nextBusinessDayStart($current->copy()->addDay()->startOfDay(), $hoursMap, $holidays);
                continue;
            }

            $tz        = $dayInfo['tz'];
            $openTime  = Carbon::createFromFormat('H:i', $dayInfo['open'], $tz)->setDate($current->year, $current->month, $current->day);
            $closeTime = Carbon::createFromFormat('H:i', $dayInfo['close'], $tz)->setDate($current->year, $current->month, $current->day);

            if ($current->lt($openTime)) {
                return $openTime;
            }

            if ($current->gte($closeTime)) {
                $current = $current->copy()->addDay()->startOfDay();
                continue;
            }

            return $current;
        }

        return $current;
    }

    private function nextBusinessDayStart(Carbon $date, array $hoursMap, array $holidays): Carbon
    {
        $safety = 0;
        while ($safety < 365) {
            $safety++;
            $dayInfo = $hoursMap[$date->dayOfWeek] ?? null;

            if ($dayInfo && $dayInfo['is_open'] && !$this->isHoliday($date, $holidays)) {
                $tz = $dayInfo['tz'];
                return Carbon::createFromFormat('H:i', $dayInfo['open'], $tz)
                    ->setDate($date->year, $date->month, $date->day);
            }

            $date = $date->copy()->addDay()->startOfDay();
        }

        return $date;
    }

    private function isHoliday(Carbon $date, array $holidays): bool
    {
        $mmdd  = $date->format('m-d');
        $ymmdd = $date->format('Y-m-d');

        foreach ($holidays as $h) {
            if ($h['recurring'] && $h['mmdd'] === $mmdd) {
                return true;
            }
            if (!$h['recurring'] && $h['date'] === $ymmdd) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<int, array{is_open: bool, open: string, close: string, tz: string}>
     */
    private function loadHoursMap(SlaPolicy $policy): array
    {
        $rows = BusinessHour::where('sla_policy_id', $policy->id)->get();

        if ($rows->isEmpty()) {
            $rows = BusinessHour::whereNull('sla_policy_id')->get();
        }

        if ($rows->isEmpty()) {
            return self::DEFAULT_HOURS;
        }

        $map = self::DEFAULT_HOURS;
        foreach ($rows as $row) {
            $map[$row->day_of_week] = [
                'is_open' => $row->is_open,
                'open'    => $row->open_time  ?? '09:00',
                'close'   => $row->close_time ?? '17:00',
                'tz'      => $row->timezone   ?? 'UTC',
            ];
        }

        return $map;
    }

    /**
     * @return list<array{recurring: bool, mmdd: string, date: string}>
     */
    private function loadHolidayDates(SlaPolicy $policy): array
    {
        $rows = Holiday::where('sla_policy_id', $policy->id)
            ->orWhereNull('sla_policy_id')
            ->get();

        return $rows->map(fn (Holiday $h) => [
            'recurring' => $h->recurring_yearly,
            'mmdd'      => $h->date->format('m-d'),
            'date'      => $h->date->format('Y-m-d'),
        ])->values()->all();
    }
}
