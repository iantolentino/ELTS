<?php

declare(strict_types=1);

use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Services\ReportService;

beforeEach(fn () => seedRoles());

// ── kpiSummary ───────────────────────────────────────────────────────────────

it('kpiSummary returns zero volume when no tickets exist in range', function () {
    $result = app(ReportService::class)->kpiSummary(now()->subDays(7), now());

    expect($result['ticket_volume'])->toBe(0)
        ->and($result['open_tickets'])->toBe(0)
        ->and($result['avg_first_response_minutes'])->toBeNull()
        ->and($result['avg_resolution_minutes'])->toBeNull()
        ->and($result['sla_compliance_pct'])->toBeNull();
});

it('kpiSummary counts only tickets created inside the date range', function () {
    $status = TicketStatus::factory()->default()->create();
    $agent  = actingAsRole('agent');

    Ticket::factory()->withStatus($status)->withRequester($agent)->count(3)->create([
        'created_at' => now()->subDays(3),
    ]);
    // Outside range — must not be counted
    Ticket::factory()->withStatus($status)->withRequester($agent)->create([
        'created_at' => now()->subDays(60),
    ]);

    $result = app(ReportService::class)->kpiSummary(now()->subDays(7), now());

    expect($result['ticket_volume'])->toBe(3);
});

// ── ticketVolumeTrend ────────────────────────────────────────────────────────

it('ticketVolumeTrend fills every day in range with zero when no tickets', function () {
    $result = app(ReportService::class)->ticketVolumeTrend(now()->subDays(6), now(), 'day');

    expect($result)->toHaveCount(7);
    foreach ($result as $point) {
        expect($point['count'])->toBe(0);
    }
});

it('ticketVolumeTrend includes ticket counts on correct days', function () {
    $status = TicketStatus::factory()->default()->create();
    $agent  = actingAsRole('agent');

    $targetDate = now()->subDays(2)->startOfDay();

    Ticket::factory()->withStatus($status)->withRequester($agent)->count(2)->create([
        'created_at' => $targetDate,
    ]);

    $result = app(ReportService::class)->ticketVolumeTrend(now()->subDays(6), now(), 'day');

    $dayLabel = $targetDate->format('M j');
    $match    = collect($result)->firstWhere('label', $dayLabel);

    expect($match)->not->toBeNull()
        ->and($match['count'])->toBe(2);
});

// ── ticketsByPriority ────────────────────────────────────────────────────────

it('ticketsByPriority groups tickets by priority correctly', function () {
    $status = TicketStatus::factory()->default()->create();
    $agent  = actingAsRole('agent');

    Ticket::factory()->withStatus($status)->withRequester($agent)->count(2)->create(['priority' => 'high',   'created_at' => now()->subDay()]);
    Ticket::factory()->withStatus($status)->withRequester($agent)->create(['priority' => 'low',    'created_at' => now()->subDay()]);
    // Outside range
    Ticket::factory()->withStatus($status)->withRequester($agent)->create(['priority' => 'critical', 'created_at' => now()->subDays(60)]);

    $result  = app(ReportService::class)->ticketsByPriority(now()->subDays(7), now());
    $indexed = collect($result)->keyBy('priority');

    expect($indexed['high']['count'])->toBe(2)
        ->and($indexed['low']['count'])->toBe(1)
        ->and($indexed->has('critical'))->toBeFalse();
});

// ── slaCompliance ────────────────────────────────────────────────────────────

it('slaCompliancePct returns null when no SLA records exist', function () {
    expect(app(ReportService::class)->slaCompliancePct(now()->subDays(7), now()))->toBeNull();
});

it('slaCompliance returns zero total when no SLA records exist', function () {
    $result = app(ReportService::class)->slaCompliance(now()->subDays(7), now());

    expect($result['total'])->toBe(0)
        ->and($result['compliant'])->toBe(0)
        ->and($result['compliance_pct'])->toBeNull();
});

// ── formatMinutes ────────────────────────────────────────────────────────────

it('formatMinutes formats durations correctly', function (float $input, string $expected) {
    expect(ReportService::formatMinutes($input))->toBe($expected);
})->with([
    [0,    '0m'],
    [45,   '45m'],
    [59,   '59m'],
    [60,   '1h'],
    [90,   '1h 30m'],
    [120,  '2h'],
    [150,  '2h 30m'],
]);

it('formatMinutes returns em dash for null', function () {
    expect(ReportService::formatMinutes(null))->toBe('—');
});
