<?php

declare(strict_types=1);

use App\Console\Commands\DispatchScheduledReports;
use App\Jobs\GenerateScheduledReport;
use App\Models\ScheduledReport;
use Illuminate\Support\Facades\Queue;

beforeEach(fn () => seedRoles());

// ── Index ────────────────────────────────────────────────────────────────────

it('admin can view scheduled reports index', function () {
    $this->actingAs(actingAsRole('admin'))
        ->get(route('admin.scheduled-reports.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/ScheduledReports/Index'));
});

it('supervisor can view scheduled reports index', function () {
    $this->actingAs(actingAsRole('supervisor'))
        ->get(route('admin.scheduled-reports.index'))
        ->assertOk();
});

it('agent is forbidden from scheduled reports index', function () {
    $this->actingAs(actingAsRole('agent'))
        ->get(route('admin.scheduled-reports.index'))
        ->assertForbidden();
});

// ── Create / store ────────────────────────────────────────────────────────────

it('admin can create a scheduled report', function () {
    $this->actingAs(actingAsRole('admin'))
        ->post(route('admin.scheduled-reports.store'), [
            'name'        => 'Weekly Overview',
            'type'        => 'overview',
            'format'      => 'pdf',
            'schedule'    => 'weekly',
            'day_of_week' => 1,
            'time_of_day' => '08:00',
            'recipients'  => 'boss@example.com',
            'is_active'   => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('scheduled_reports', [
        'name'   => 'Weekly Overview',
        'type'   => 'overview',
        'format' => 'pdf',
    ]);
});

it('supervisor cannot create a scheduled report', function () {
    $this->actingAs(actingAsRole('supervisor'))
        ->post(route('admin.scheduled-reports.store'), [
            'name'       => 'Should Fail',
            'type'       => 'overview',
            'format'     => 'pdf',
            'schedule'   => 'daily',
            'time_of_day' => '09:00',
            'recipients' => 'x@example.com',
        ])
        ->assertForbidden();
});

// ── Update ───────────────────────────────────────────────────────────────────

it('admin can update a scheduled report', function () {
    $admin  = actingAsRole('admin');
    $report = ScheduledReport::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->put(route('admin.scheduled-reports.update', $report), [
            'name'        => 'Updated Name',
            'type'        => $report->type,
            'format'      => $report->format,
            'schedule'    => $report->schedule,
            'time_of_day' => '10:00',
            'recipients'  => 'updated@example.com',
            'is_active'   => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('scheduled_reports', ['name' => 'Updated Name']);
});

// ── Delete ───────────────────────────────────────────────────────────────────

it('admin can delete a scheduled report', function () {
    $admin  = actingAsRole('admin');
    $report = ScheduledReport::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->delete(route('admin.scheduled-reports.destroy', $report))
        ->assertRedirect();

    $this->assertDatabaseMissing('scheduled_reports', ['id' => $report->id]);
});

// ── Toggle ────────────────────────────────────────────────────────────────────

it('admin can toggle a scheduled report active state', function () {
    $admin  = actingAsRole('admin');
    $report = ScheduledReport::factory()->create([
        'created_by' => $admin->id,
        'is_active'  => true,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.scheduled-reports.toggle', $report))
        ->assertRedirect();

    expect($report->fresh()->is_active)->toBeFalse();
});

// ── Dispatch command ──────────────────────────────────────────────────────────

it('DispatchScheduledReports dispatches a job for an active daily report due now', function () {
    Queue::fake();

    ScheduledReport::factory()->create([
        'schedule'    => 'daily',
        'time_of_day' => now()->format('H:i') . ':00',
        'is_active'   => true,
    ]);

    $this->artisan(DispatchScheduledReports::class)->assertExitCode(0);

    Queue::assertPushed(GenerateScheduledReport::class, 1);
});

it('DispatchScheduledReports skips inactive reports', function () {
    Queue::fake();

    ScheduledReport::factory()->create([
        'schedule'    => 'daily',
        'time_of_day' => now()->format('H:i') . ':00',
        'is_active'   => false,
    ]);

    $this->artisan(DispatchScheduledReports::class)->assertExitCode(0);

    Queue::assertNothingPushed();
});

it('DispatchScheduledReports skips a daily report not due yet', function () {
    Queue::fake();

    ScheduledReport::factory()->create([
        'schedule'    => 'daily',
        'time_of_day' => now()->addHour()->format('H:i') . ':00',
        'is_active'   => true,
    ]);

    $this->artisan(DispatchScheduledReports::class)->assertExitCode(0);

    Queue::assertNothingPushed();
});
