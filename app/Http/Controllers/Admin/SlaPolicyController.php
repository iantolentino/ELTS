<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SlaPolicies\CreateSlaPolicyRequest;
use App\Http\Requests\Admin\SlaPolicies\UpdateSlaPolicyRequest;
use App\Models\SlaPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SlaPolicyController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', SlaPolicy::class);

        return Inertia::render('Admin/SlaPolicies/Index', [
            'policies' => SlaPolicy::withCount('slaRecords')
                ->orderByRaw('FIELD(priority, "critical","high","medium","low") ASC, priority IS NULL ASC, name ASC')
                ->get()
                ->map(fn (SlaPolicy $p) => [
                    'id'                      => $p->id,
                    'name'                    => $p->name,
                    'description'             => $p->description,
                    'priority'                => $p->priority,
                    'first_response_minutes'  => $p->first_response_minutes,
                    'first_response_label'    => $p->firstResponseLabel(),
                    'resolution_minutes'      => $p->resolution_minutes,
                    'resolution_label'        => $p->resolutionLabel(),
                    'uses_business_hours'     => $p->uses_business_hours,
                    'is_active'               => $p->is_active,
                    'sla_records_count'       => $p->sla_records_count,
                ]),
        ]);
    }

    public function store(CreateSlaPolicyRequest $request): RedirectResponse
    {
        SlaPolicy::create($request->validated());

        return redirect()->route('admin.sla-policies.index')->with('success', 'SLA policy created.');
    }

    public function update(UpdateSlaPolicyRequest $request, SlaPolicy $slaPolicy): RedirectResponse
    {
        $slaPolicy->update($request->validated());

        return redirect()->route('admin.sla-policies.index')->with('success', 'SLA policy updated.');
    }

    public function destroy(SlaPolicy $slaPolicy): RedirectResponse
    {
        Gate::authorize('delete', SlaPolicy::class);

        $slaPolicy->delete();

        return redirect()->route('admin.sla-policies.index')->with('success', 'SLA policy deleted.');
    }
}
