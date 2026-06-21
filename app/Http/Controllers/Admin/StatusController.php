<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Statuses\CreateStatusRequest;
use App\Http\Requests\Admin\Statuses\UpdateStatusRequest;
use App\Models\TicketStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StatusController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin']), 403);

        return Inertia::render('Admin/Statuses/Index', [
            'statuses' => TicketStatus::withCount('tickets')->orderBy('sort_order')->get(),
        ]);
    }

    public function store(CreateStatusRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            if ($request->boolean('is_default')) {
                TicketStatus::where('is_default', true)->update(['is_default' => false]);
            }
            TicketStatus::create($request->validated());
        });

        return back()->with('success', 'Status created.');
    }

    public function update(UpdateStatusRequest $request, TicketStatus $status): RedirectResponse
    {
        DB::transaction(function () use ($request, $status) {
            if ($request->boolean('is_default') && !$status->is_default) {
                TicketStatus::where('is_default', true)->update(['is_default' => false]);
            }
            $status->update($request->validated());
        });

        return back()->with('success', 'Status updated.');
    }

    public function destroy(Request $request, TicketStatus $status): RedirectResponse
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin']), 403);
        abort_if($status->tickets_count > 0, 422, 'Cannot delete a status that has tickets.');
        abort_if($status->is_default, 422, 'Cannot delete the default status.');

        $status->delete();

        return back()->with('success', 'Status deleted.');
    }
}
