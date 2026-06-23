<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ScheduledReportRequest;
use App\Models\ScheduledReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ScheduledReportController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', ScheduledReport::class);

        $reports = ScheduledReport::with('creator:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/ScheduledReports/Index', [
            'reports' => $reports,
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', ScheduledReport::class);

        return Inertia::render('Admin/ScheduledReports/Create');
    }

    public function store(ScheduledReportRequest $request): RedirectResponse
    {
        Gate::authorize('create', ScheduledReport::class);

        ScheduledReport::create([
            'name'          => $request->string('name'),
            'type'          => $request->string('type'),
            'format'        => $request->string('format'),
            'schedule'      => $request->string('schedule'),
            'day_of_week'   => $request->input('schedule') === 'weekly'  ? $request->integer('day_of_week')  : null,
            'day_of_month'  => $request->input('schedule') === 'monthly' ? $request->integer('day_of_month') : null,
            'time_of_day'   => $request->string('time_of_day') . ':00',
            'recipients'    => $request->resolvedRecipients(),
            'params'        => $request->input('type') === 'custom' ? $request->input('params') : null,
            'is_active'     => $request->boolean('is_active', true),
            'created_by'    => $request->user()->id,
        ]);

        return redirect()->route('admin.scheduled-reports.index')
            ->with('success', 'Scheduled report created.');
    }

    public function edit(ScheduledReport $scheduledReport): Response
    {
        Gate::authorize('update', $scheduledReport);

        return Inertia::render('Admin/ScheduledReports/Edit', [
            'report' => $scheduledReport,
        ]);
    }

    public function update(ScheduledReportRequest $request, ScheduledReport $scheduledReport): RedirectResponse
    {
        Gate::authorize('update', $scheduledReport);

        $scheduledReport->update([
            'name'          => $request->string('name'),
            'type'          => $request->string('type'),
            'format'        => $request->string('format'),
            'schedule'      => $request->string('schedule'),
            'day_of_week'   => $request->input('schedule') === 'weekly'  ? $request->integer('day_of_week')  : null,
            'day_of_month'  => $request->input('schedule') === 'monthly' ? $request->integer('day_of_month') : null,
            'time_of_day'   => $request->string('time_of_day') . ':00',
            'recipients'    => $request->resolvedRecipients(),
            'params'        => $request->input('type') === 'custom' ? $request->input('params') : null,
            'is_active'     => $request->boolean('is_active', true),
        ]);

        return redirect()->route('admin.scheduled-reports.index')
            ->with('success', 'Scheduled report updated.');
    }

    public function destroy(ScheduledReport $scheduledReport): RedirectResponse
    {
        Gate::authorize('delete', $scheduledReport);

        $scheduledReport->delete();

        return redirect()->route('admin.scheduled-reports.index')
            ->with('success', 'Scheduled report deleted.');
    }

    public function toggle(ScheduledReport $scheduledReport): RedirectResponse
    {
        Gate::authorize('update', $scheduledReport);

        $scheduledReport->update(['is_active' => !$scheduledReport->is_active]);

        return back()->with('success', $scheduledReport->is_active ? 'Report activated.' : 'Report paused.');
    }
}
