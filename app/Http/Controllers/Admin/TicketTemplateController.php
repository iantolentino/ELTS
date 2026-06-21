<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Templates\CreateTemplateRequest;
use App\Http\Requests\Admin\Templates\UpdateTemplateRequest;
use App\Models\TicketCategory;
use App\Models\TicketTag;
use App\Models\TicketTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TicketTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin', 'supervisor']), 403);

        return Inertia::render('Admin/Templates/Index', [
            'templates' => TicketTemplate::with('category:id,name', 'creator:id,name')
                ->orderBy('name')->get(),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin', 'supervisor']), 403);

        return Inertia::render('Admin/Templates/Create', [
            'categories' => TicketCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'tags'       => TicketTag::orderBy('name')->get(['id', 'name', 'color']),
        ]);
    }

    public function store(CreateTemplateRequest $request): RedirectResponse
    {
        TicketTemplate::create(array_merge($request->validated(), [
            'created_by' => Auth::id(),
            'is_active'  => $request->boolean('is_active', true),
        ]));

        return redirect()->route('admin.templates.index')->with('success', 'Template created.');
    }

    public function edit(Request $request, TicketTemplate $template): Response
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin', 'supervisor']), 403);

        return Inertia::render('Admin/Templates/Edit', [
            'template'   => $template,
            'categories' => TicketCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'tags'       => TicketTag::orderBy('name')->get(['id', 'name', 'color']),
        ]);
    }

    public function update(UpdateTemplateRequest $request, TicketTemplate $template): RedirectResponse
    {
        $template->update($request->validated());

        return redirect()->route('admin.templates.index')->with('success', 'Template updated.');
    }

    public function destroy(Request $request, TicketTemplate $template): RedirectResponse
    {
        abort_unless($request->user()?->hasRole(['super_admin', 'admin', 'supervisor']), 403);

        $template->delete();

        return back()->with('success', 'Template deleted.');
    }
}
